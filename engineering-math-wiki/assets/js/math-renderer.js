"use strict";
(function(root){
  const skipped="pre,code,input,textarea,select,option,button,script,style,a,.math-expression";
  let observer;
  function available(){return Boolean(root.katex && document.querySelector("#katex-style")?.sheet);}
  function sourceText(node){
    if(!node)return "";
    if(node.nodeType===Node.TEXT_NODE)return node.nodeValue;
    if(node.nodeType!==Node.ELEMENT_NODE&&node.nodeType!==Node.DOCUMENT_FRAGMENT_NODE)return "";
    if(node.classList?.contains("math-expression"))return node.dataset.mathSource||"";
    return [...node.childNodes].map(sourceText).join("");
  }
  function mathNode(tex,display,source){
    const node=document.createElement("span");
    node.className="math-expression "+(display?"math-display":"math-inline");
    node.dataset.latex=tex;node.dataset.mathSource=source;
    node.setAttribute("role","group");node.setAttribute("aria-label","數學公式");
    if(display){node.tabIndex=0;node.setAttribute("aria-label","獨立公式，可水平捲動");}
    paint(node);return node;
  }
  function paint(node){
    if(!available()){
      node.textContent=node.dataset.mathSource;
      node.classList.add("math-fallback");node.dataset.mathState="unavailable";return;
    }
    try{
      root.katex.render(node.dataset.latex,node,{
        displayMode:node.classList.contains("math-display"),throwOnError:true,
        trust:false,strict:"error",maxExpand:1000,maxSize:20,output:"htmlAndMathml"
      });
      node.classList.remove("math-fallback","math-error");node.dataset.mathState="rendered";
    }catch(error){
      node.textContent=node.dataset.mathSource;node.classList.add("math-fallback","math-error");
      node.dataset.mathState="error";node.title="公式無法渲染："+error.message;
    }
  }
  const delimiters=/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g;
  function appendExplicit(fragment,text){
    let at=0;
    for(const match of text.matchAll(delimiters)){
      fragment.append(document.createTextNode(text.slice(at,match.index)));
      fragment.append(mathNode(match[1]??match[2],match[2]!==undefined,match[0]));
      at=match.index+match[0].length;
    }
    fragment.append(document.createTextNode(text.slice(at)));
  }
  function processText(textNode){
    if(!textNode.parentElement||textNode.parentElement.closest(skipped))return;
    const original=textNode.nodeValue;
    if(!original.trim())return;
    const fragment=document.createDocumentFragment();let at=0,hasMath=false;
    for(const match of original.matchAll(delimiters)){
      appendPlain(fragment,original.slice(at,match.index));
      fragment.append(mathNode(match[1]??match[2],match[2]!==undefined,match[0]));
      at=match.index+match[0].length;hasMath=true;
    }
    appendPlain(fragment,original.slice(at));
    if(hasMath||fragment.querySelector(".math-expression"))textNode.replaceWith(fragment);
  }
  function appendPlain(fragment,text){
    if(!root.MathNotation){fragment.append(document.createTextNode(text));return;}
    const converted=root.MathNotation.convert(text);
    if(converted===text){fragment.append(document.createTextNode(text));return;}
    const wrapper=document.createElement("span");wrapper.className="math-expression math-fragment";
    wrapper.dataset.mathSource=text;
    const inner=document.createDocumentFragment();appendExplicit(inner,converted);
    wrapper.append(inner);fragment.append(wrapper);
  }
  function previews(container){
    container.querySelectorAll(".calculator select[name='functionId']").forEach(select=>{
      let preview=select.closest(".calculator").querySelector(".math-problem");
      if(!preview){preview=document.createElement("div");preview.className="math-problem";select.closest("form").before(preview);}
      const label=select.selectedOptions[0]?.textContent||"";
      if(preview.dataset.selection===label)return;
      preview.dataset.selection=label;
      if(select.id==="transform-functionId"&&select.value==="rectangle"){
        preview.replaceChildren(mathNode("f(t)=\\begin{cases}A,&|t|\\le T/2,\\\\0,&\\text{其他時間}.\\end{cases}",true,label));
      }else preview.textContent=root.MathNotation?root.MathNotation.convert(label,true):label;
    });
  }
  function renderTree(container){
    if(!container)return;
    if(observer)observer.disconnect();
    try{
      previews(container);
      container.querySelectorAll(".math-expression[data-latex]").forEach(node=>{
        if(node.dataset.mathState==="unavailable"&&available())paint(node);
      });
      const walker=document.createTreeWalker(container,NodeFilter.SHOW_TEXT),nodes=[];
      while(walker.nextNode())nodes.push(walker.currentNode);
      nodes.forEach(processText);
      const status=document.querySelector("#math-status");
      if(status){status.hidden=available();status.textContent=available()?"":"公式渲染資源無法載入，以下保留原始公式；筆記與計算器仍可使用。";}
    }finally{
      if(observer)observer.observe(document.querySelector("#note-detail"),{childList:true,subtree:true});
    }
  }
  function matrix(matrix,augmented=true){
    const body=matrix.map(row=>row.map(value=>root.MathNotation.latex(String(value))).join("&")).join("\\\\");
    const cols=matrix[0].length;
    const tex=augmented?"\\left[\\begin{array}{"+"c".repeat(cols-1)+"|c}"+body+"\\end{array}\\right]":
      "\\begin{bmatrix}"+body+"\\end{bmatrix}";
    const node=mathNode(tex,true,matrix.map(row=>row.join("  ")).join("\n"));
    node.classList.add("matrix-display");return node;
  }
  root.MathDisplay={renderTree,sourceText,mathNode,matrix,available};
  observer=new MutationObserver(()=>renderTree(document.querySelector("#note-detail")));
  renderTree(document.querySelector("#note-detail"));
  document.querySelector("#katex-style")?.addEventListener("load",()=>renderTree(document.querySelector("#note-detail")));
})(globalThis);
