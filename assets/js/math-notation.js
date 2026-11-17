"use strict";(function installNotation(root){
  const names={xl:"x_l",xu:"x_u",xr:"x_r",x0:"x_0",xNext:"x_{\\mathrm{next}}",xOld:"x_{\\mathrm{old}}",fx:"f(x)",fl:"f(x_l)",fu:"f(x_u)",fr:"f(x_r)",dfx:"f'(x)",fnext:"f(x_{\\mathrm{next}})",dt:"\\,\\mathrm{d}t",dw:"\\,\\mathrm{d}\\omega",st:"st",at:"at",bt:"bt",AT:"AT",ROC:"\\mathrm{ROC}",RREF:"\\mathrm{RREF}",inf:"\\infty",NaN:"\\mathrm{NaN}",Inf:"\\infty",j:"\\mathrm{j}",pi:"\\pi",sigma:"\\sigma",omega:"\\omega",rho:"\\rho"};
  const greek={"σ":"\\sigma","ω":"\\omega","π":"\\pi","ν":"\\nu","∞":"\\infty","α":"\\alpha","β":"\\beta","ε":"\\varepsilon","ρ":"\\rho","Δ":"\\Delta","∫":"\\int"};
  function ident(s){
    if(names[s])return names[s];
    if(/^A\d,\d$/.test(s))return "A_{"+s.slice(1)+"}";
    if(/^R\d+$/.test(s))return "R_{"+s.slice(1)+"}";
    const parts=s.split("_"),base=parts.shift();
    let out=names[base]||(/^[a-zA-Z]$/.test(base)?base:/^[A-Za-z]\d+$/.test(base)?base[0]+"_{"+base.slice(1)+"}":base==="Re"?"\\operatorname{Re}":/^(?:st|at|bt|nn|ij|ik|kk|ii|ij|σω)$/.test(base)?base:"\\mathrm{"+base+"}");
    if(parts.length){
      let subs=parts.map(p=>p.startsWith("(")?latex(p.slice(1,-1)):/^[a-zA-Z]{1,2}$/.test(p)?p:/^\d+$/.test(p)?p:"\\mathrm{"+p+"}");
      if(["xl","xu","xr"].includes(base)){out="x";subs=[base[1],...subs];}
      else if(/^[A-Za-z]\d+$/.test(base)){out=base[0];subs=[base.slice(1),...subs];}
      out+="_{"+subs.join(",")+"}";
    }
    return out;
  }
  function latex(input){
    const source=input.trim().replace(/−/g,"-").replace(/×/g,"*");
    if(/^A\d,\d$/.test(source))return ident(source);
    const tokens=[];let position=0;
    while(position<source.length){
      if(/\s/.test(source[position])){position++;continue;}
      const rest=source.slice(position);
      if(rest[0]==="["){
        let depth=1,end=1;
        for(;end<rest.length&&depth;end++){if(rest[end]==="[")depth++;else if(rest[end]==="]")depth--;}
        if(depth)throw Error("unclosed bracket");
        tokens.push({type:"bracket",value:rest.slice(1,end-1)});position+=end;continue;
      }
      const match=rest.match(/^(?:\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)/);
      if(match){tokens.push({type:"number",value:match[0]});position+=match[0].length;continue;}
      const word=rest.match(/^[A-Za-z]+[0-9]*(?:_(?:[A-Za-z0-9]+|\([^()]*\)))*/);
      if(word){
        if(["at","st","bt","AT","cu","cv","jv"].includes(word[0])) {
          word[0].split("").forEach(value=>tokens.push({type:"id",value}));
        } else tokens.push({type:"id",value:word[0]});
        position+=word[0].length;continue;
      }
      const op=rest.match(/^(?:<->|<-|->|<=|>=|!=|\.\.\.|\.\.|[=<>+*/^(),;|'!{}-]|[≈↔←→±])/);
      if(op){tokens.push({type:"op",value:op[0]});position+=op[0].length;continue;}
      if(greek[rest[0]]){tokens.push({type:"greek",value:rest[0]});position++;continue;}
      if(rest[0]==="∑"){tokens.push({type:"id",value:"sum"});position++;continue;}
      throw Error("unsupported token "+rest[0]);
    }
    let index=0;
    const peek=()=>tokens[index]?.value;
    const take=()=>tokens[index++];
    function atom(){
      const token=take();if(!token)throw Error("missing atom");
      if(token.value==="+"||token.value==="-")return token.value+expression(4);
      if(token.value==="^")return "{}^{"+atom()+"}";
      if(token.value==="("||token.value==="{"){
        const end=token.value==="("?")":"}";
        const inner=expression(0,new Set([end]));
        if(peek()!==end)throw Error("unclosed group");
        take();return "\\left("+inner+"\\right)";
      }
      if(token.value==="|"){
        const inner=expression(0,new Set(["|"]));
        if(peek()!=="|")throw Error("unclosed absolute");take();
        return "\\left|"+inner+"\\right|";
      }
      if(token.type==="bracket"){
        const s=token.value;
        if(s.includes(";")){
          const rows=s.split(";").map(r=>r.trim());
          const augmented=rows.some(r=>r.includes("|"));
          const cells=rows.map(r=>r.replace(/\|/g," | ").trim().split(/\s+/).filter(Boolean));
          const cols=cells[0].filter(c=>c!=="|").length;
          if(!cells.every(r=>r.filter(c=>c!=="|").length===cols))throw Error("matrix shape");
          const body=cells.map(row=>row.filter(c=>c!=="|").map(latex).join("&")).join("\\\\");
          if(augmented){
            const split=cells[0].indexOf("|");
            return "\\left[\\begin{array}{"+("c".repeat(split))+"|"+("c".repeat(cols-split))+"}"+body+"\\end{array}\\right]";
          }
          return "\\begin{bmatrix}"+body+"\\end{bmatrix}";
        }
        if(s.includes("|"))return "\\left["+s.split("|").map(p=>/^[A-Za-z]+$/.test(p.trim())?ident(p.trim()):latex(p)).join("\\,\\middle|\\,")+"\\right]";
        return "\\left["+s.split(",").map(p=>p.trim()?latex(p):"").join(",")+"\\right]";
      }
      if(token.type==="number"){
        const m=token.value.match(/^(.+)[eE]([+-]?\d+)$/);
        return m?m[1]+"\\times10^{"+m[2].replace(/^\+/,"")+"}":token.value;
      }
      if(token.type==="op"&&["<",">","<=",">=","!=","≈","="].includes(token.value))return ({"<=":"\\le",">=":"\\ge","!=":"\\ne","≈":"\\approx"})[token.value]||token.value;
      let value=token.type==="greek"?greek[token.value]:ident(token.value);
      while(peek()==="'"){take();value+="'";}
      if(token.value==="∫"&&tokens[index]?.type==="bracket"){
        const bounds=take().value.split(",");
        return "\\int_{"+latex(bounds[0])+"}^{"+latex(bounds[1])+"}";
      }
      if(token.type==="id"&&peek()==="("){
        take();const args=[];
        while(peek()!==")"){
          args.push(expression(0,new Set([",",")"])));
          if(peek()===",")take();else break;
        }
        if(peek()!==")")throw Error("function close");take();
        if(token.value==="sqrt")return "\\sqrt{"+args.join(",")+"}";
        if(token.value==="abs")return "\\left|"+args.join(",")+"\\right|";
        if(token.value==="norm")return "\\left\\lVert "+args[0]+"\\right\\rVert_{"+(args[1]||"\\infty")+"}";
        if(token.value==="ceil")return "\\left\\lceil"+args.join(",")+"\\right\\rceil";
        const fn=["sin","cos","tan","exp","log","max","min","det"].includes(token.value)?"\\"+token.value:token.value==="log2"?"\\log_2":value;
        return fn+"\\left("+args.join(",")+"\\right)";
      }
      return value;
    }
    const precedence={"=":1,"<":1,">":1,"<=":1,">=":1,"!=":1,"≈":1,"->":1,"<-":1,"<->":1,"↔":1,"←":1,"→":1,",":0,";":0,"..":1,"...":1,"+":2,"-":2,"±":2,"*":3,"/":3,"^":4};
    const operators={"<=":"\\le",">=":"\\ge","!=":"\\ne","≈":"\\approx","->":"\\to","<-":"\\leftarrow","<->":"\\leftrightarrow","↔":"\\leftrightarrow","←":"\\leftarrow","→":"\\to","..":"\\ldots","...":"\\cdots","*":"\\,","±":"\\pm"};
    function expression(min,stops=new Set()){
      let left=atom();
      while(index<tokens.length&&!stops.has(peek())){
        const op=peek(),known=Object.hasOwn(precedence,op),p=known?precedence[op]:3;
        if(p<min)break;
        if(!known){
          if(op===")"||op==="}"||op==="|")break;
          const right=expression(4,stops);left+="\\,"+right;continue;
        }
        take();
        const right=expression(op==="^"?p:p+1,stops);
        left=op==="/"? "\\frac{"+left+"}{"+right+"}":op==="^"?"{"+left+"}^{"+right+"}":left+" "+(operators[op]||op)+" "+right;
      }
      return left;
    }
    if(!tokens.length)throw Error("empty");
    const result=expression(0);
    if(index!==tokens.length)throw Error("unconsumed");
    return result;
  }
  const candidate=/[A-Za-z0-9α-ωΑ-Ω∞∫∑|()[\]{}^_=+*\/.,;<>!↔←→≈±%'-]+(?:[ \t]+[A-Za-z0-9α-ωΑ-Ω∞∫∑|()[\]{}^_=+*\/.,;<>!↔←→≈±%'-]+)*/g;
  function convert(text,display=false){
    return text.replace(candidate,(raw)=>{
      const trailing=raw.match(/[.,;]+$/)?.[0]||"";
      let core=trailing?raw.slice(0,-trailing.length):raw;
      if(!core)return raw;
      let prefix="";
      const leader=core.match(/^(MATLAB|JavaScript|Gauss-Seidel|Newton-Raphson)\s+/);
      if(leader){prefix=leader[0];core=core.slice(prefix.length);}
      const qualified=/[=<>^/|∫∑≈_\[\]]|\b(?:f|F|sqrt|norm|sin|cos|Re)\(|[α-ωΑ-Ω∞]|^[A-Za-z](?:_[\w()]+|\d+)?$|^\d+(?:\.\d+)?(?:e[+-]?\d+)?$/.test(core);
      if(!qualified)return raw;
      try{return prefix+(display?"\\[":"\\(")+latex(core)+(display?"\\]":"\\)")+trailing;}
      catch{return raw;}
    });
  }
  root.MathNotation={latex,convert};
})(globalThis);