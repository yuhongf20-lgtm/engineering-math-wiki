"use strict";
(function(root){
 function runExtendedCalculatorTests(api){
  const passed=[],near=(a,b,t=1e-10)=>Math.abs(a-b)<=t;
  const check=(ok,title)=>{if(!ok)throw Error(title);passed.push(title);};
  const rejects=(fn,title)=>{let rejected=false;try{fn();}catch{rejected=true;}check(rejected,title);};
  const base={functionId:"quadratic",xl:1,xu:2,tolerance:1e-4,maxIterations:100};
  let r=api.falsePosition(base);
  check(r.converged&&r.iterations===6&&near(r.xr,239/169)&&Math.abs(r.fr)<=1e-4,"假位預設六次達標並吻合教材");
  r=api.falsePosition({...base,tolerance:1e-12,maxIterations:200});
  check(r.converged&&near(r.xr,Math.SQRT2,1e-12),"假位高精度 sqrt(2)");
  for(const [functionId,xl,xu,expected]of [["cubic",1,2,1.5213797068045676],["cosine",0,1,.7390851332151607]]){
   r=api.falsePosition({...base,functionId,xl,xu,tolerance:1e-10});check(r.converged&&near(r.xr,expected),"假位固定函數 "+functionId);
  }
  r=api.falsePosition({...base,maxIterations:1,tolerance:1e-12});check(!r.converged&&r.reason==="max-iterations","假位不足迭代不宣稱成功");
  r=api.falsePosition({...base,functionId:"cosine",xl:.7390851332151607,xu:1});check(r.converged&&r.iterations===0,"假位端點根");
  for(const extra of [{xl:2,xu:3},{xl:2,xu:1},{tolerance:0},{maxIterations:1.5},{maxIterations:1001},{xl:Infinity},{functionId:"missing"},{xl:1e200,xu:2e200}]){
   rejects(()=>api.falsePosition({...base,...extra}),"假位無效輸入 "+JSON.stringify(extra));
  }
  rejects(()=>api.falsePosition({...base,xl:Math.SQRT2-Number.EPSILON,xu:Math.SQRT2,tolerance:Number.MIN_VALUE}),"假位分母接近零");
  const A=[[4,1],[1,3]],b=[9,7],expected=[20/11,19/11];
  for(const method of ["gaussianElimination","gaussJordan"]){
   const copy=JSON.stringify({A,b});r=api[method]({A,b});
   check(r.success&&r.x.every((v,i)=>near(v,expected[i],1e-12)),"指定 2x2 方程組 "+method);
   check(r.residual.norm<1e-12,"原式殘差 "+method);
   check(r.steps.length>1,"列運算快照 "+method);
   check(JSON.stringify({A,b})===copy,"不改動輸入矩陣 "+method);
   if(method==="gaussianElimination")check(r.backSubstitution.length===2,"回代兩個分量");
   for(const rhs of [[3,6],[3,7]]){
    r=api[method]({A:[[1,2],[2,4]],b:rhs});check(!r.success&&r.x===null,"無唯一解不顯示假解 "+method+" "+rhs);
   }
   r=api[method]({A:[[0,2,1],[2,1,1],[1,1,3]],b:[7,7,12]});
   check(r.success&&r.x.every((v,i)=>near(v,i+1))&&r.steps.some(s=>s.description.includes("↔")),"3x3 換列 "+method);
   for(const params of [{A:[[1,2]],b:[3]},{A:[[1,2],[2,3]],b:[1]},{A:[[1,NaN],[2,3]],b:[1,2]},{A:[[1,2],[2,3]],b:[Infinity,2]}]){
    rejects(()=>api[method](params),"矩陣無效輸入 "+method+" "+JSON.stringify(params));
   }
   r=api[method]({A:[[1,0],[0,1e-15]],b:[1,1e-15]});check(!r.success&&r.x===null,"數值近奇異保護 "+method);
  }
  const gs={A,b,x0:[0,0],tolerance:1e-8,maxIterations:1000};
  r=api.gaussSeidel(gs);
  check(r.converged&&r.x.every((v,i)=>near(v,expected[i],1e-8))&&r.residual.norm<=1e-8,"賽德指定 2x2 解與殘差");
  check(r.history.length===r.iterations&&r.diagonallyDominant,"賽德迭代紀錄與對角優勢");
  r=api.gaussSeidel({...gs,A:[[4,1,0],[1,4,1],[0,1,3]],b:[6,12,11],x0:[0,0,0]});check(r.converged&&r.x.every((v,i)=>near(v,i+1,1e-8)),"賽德 3x3");
  r=api.gaussSeidel({...gs,A:[[1,2],[2,5]],b:[3,7]});check(r.converged&&!r.diagonallyDominant&&r.x.every(v=>near(v,1,1e-7)),"非對角優勢仍可收斂");
  r=api.gaussSeidel({...gs,maxIterations:1});check(!r.converged&&r.reason==="max-iterations","賽德不足迭代");
  r=api.gaussSeidel({...gs,A:[[1,2],[2,1]],b:[3,3]});check(!r.converged&&r.reason==="diverging","賽德快速增長保護");
  r=api.gaussSeidel({...gs,A:[[1,2],[2,4]],b:[3,6]});check(!r.converged&&r.reason==="singular","賽德奇異保護");
  for(const extra of [{A:[[0,1],[1,3]]},{x0:[0]},{x0:[NaN,0]},{tolerance:0},{maxIterations:0},{maxIterations:1.5}]){
   rejects(()=>api.gaussSeidel({...gs,...extra}),"賽德無效輸入 "+JSON.stringify(extra));
  }
  r=api.gaussSeidel({A:[[4,1],[2,3]],b:[6,8],x0:[0,0],tolerance:.01,maxIterations:100});
  const matlabRows=[[1.5,5/3,5/3],[13/12,35/18,5/18],[73/72,215/108,5/108],[433/432,1295/648,5/648]];
  check(r.converged&&r.iterations===4&&r.history.every((row,i)=>near(row.x[0],matlabRows[i][0])&&near(row.x[1],matlabRows[i][1])&&near(row.residual,matlabRows[i][2])),"賽德 JavaScript 與既有 MATLAB 教材逐輪一致");
  return passed;
 }
 if(typeof module!=="undefined"&&module.exports){module.exports=runExtendedCalculatorTests;if(require.main===module)console.log(runExtendedCalculatorTests(require("../assets/js/calculators.js")).map(t=>"PASS "+t).join("\n"));}
 else root.runExtendedCalculatorTests=runExtendedCalculatorTests;
})(globalThis);
