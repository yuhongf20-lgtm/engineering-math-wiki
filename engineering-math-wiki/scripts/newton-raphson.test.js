"use strict";
(function(root){
 function runNewtonTests(api){
  const passed=[];
  const check=(ok,title)=>{if(!ok)throw Error(title);passed.push(title);};
  const run=(extra={})=>api.newtonRaphson({functionId:"quadratic",x0:1.5,tolerance:1e-4,maxIterations:50,...extra});
  const reject=(extra,title)=>{let caught=false;try{run(extra);}catch{caught=true;}check(caught,title);};
  let r=run();
  check(r.converged && r.iterations===2 && Math.abs(r.fr)<=1e-4,"Newton 預設兩次更新達殘差條件");
  check(Math.abs(r.xr-Math.SQRT2)<3e-6,"Newton 預設近似根正確");
  r=run({tolerance:1e-12});
  check(r.converged&&r.iterations===4&&Math.abs(r.xr-Math.SQRT2)<1e-14,"Newton 教材四次更新提前達標");
  const expected=[
   [1.5,.25,3,1.4166666666666667],
   [1.4166666666666667,.006944444444444642,2.8333333333333335,1.4142156862745099],
   [1.4142156862745099,6.007304882871267e-6,2.8284313725490198,1.4142135623746899],
   [1.4142135623746899,4.510614104447086e-12,2.8284271247493797,1.4142135623730951]
  ];
  check(r.history.every((row,i)=>["x","fx","dfx","xNext"].every((key,j)=>Math.abs(row[key]-expected[i][j])<1e-14)),"Newton 教材逐欄數值獨立常數核對");
  for(const [functionId,x0,expectedRoot] of [["quadratic",1.5,Math.SQRT2],["cubic",1.5,1.5213797068045676],["cosine",.5,.7390851332151607]]){
   r=run({functionId,x0,tolerance:1e-12});
   check(r.converged&&Math.abs(r.fr)<=1e-12&&Math.abs(r.xr-expectedRoot)<1e-11,"Newton 三函數 "+functionId);
  }
  for(const x0 of [0,1e-15,-1e-15]){
   r=run({x0});check(!r.converged&&r.reason==="derivative"&&r.iterations===0,"Newton 零或近零導數 "+x0);
  }
  r=run({functionId:"cubic",x0:1/Math.sqrt(3)});check(!r.converged&&r.reason==="derivative","Newton 三次函數臨界點保護");
  r=run({maxIterations:1,tolerance:1e-12});
  check(!r.converged&&r.reason==="max-iterations"&&r.iterations===1,"Newton 迭代不足不得成功");
  r=run({x0:1.5,tolerance:.25});check(r.converged&&r.iterations===0,"Newton 初始殘差達標為零次");
  r=run({x0:1e308});check(!r.converged&&r.reason==="non-finite","Newton 初始函數溢位");
  r=run({functionId:"cubic",x0:1e-0,tolerance:Number.MIN_VALUE,maxIterations:1000});
  check(r.converged || ["precision","max-iterations"].includes(r.reason),"Newton 極小容許值受精度或上限約束");
  r=run({tolerance:Number.MIN_VALUE,maxIterations:1000});
  check(!r.converged&&["precision","max-iterations"].includes(r.reason)&&r.iterations<=1000,"Newton 浮點極限不假裝達標");
  for(const x0 of [NaN,Infinity,-Infinity,"1.5",null,undefined])reject({x0},"Newton 拒絕初始值 "+String(x0));
  for(const tolerance of [0,-1,NaN,Infinity,"0.1",null])reject({tolerance},"Newton 拒絕誤差 "+String(tolerance));
  for(const maxIterations of [0,-1,1.5,1001,NaN,Infinity,"50"])reject({maxIterations},"Newton 拒絕迭代次數 "+String(maxIterations));
  reject({functionId:"not-registered"},"Newton 未登記函數拒絕");
  return {passed,defaultResult:run()};
 }
 if(typeof module!=="undefined"&&module.exports){
  module.exports=runNewtonTests;
  if(require.main===module){const r=runNewtonTests(require("../assets/js/calculators.js"));console.log(r.passed.map(t=>"PASS "+t).join("\n"));}
 }else root.runNewtonTests=runNewtonTests;
})(globalThis);
