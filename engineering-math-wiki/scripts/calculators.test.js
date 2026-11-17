"use strict";

// Run in the browser test page, or: node scripts/calculators.test.js
(function (root) {
  function runCalculatorTests(api) {
    const passed = [];
    const check = (ok, message) => { if (!ok) throw new Error(message); passed.push(message); };
    const base = { functionId: "quadratic", xl: 1, xu: 2, tolerance: 1e-4, maxIterations: 50 };
    const run = (overrides = {}) => api.bisection({ ...base, ...overrides });
    const rejects = (overrides, title) => {
      let failed = false;
      try { run(overrides); } catch { failed = true; }
      check(failed, title);
    };
    let r = run();
    check(r.converged && Math.abs(r.fr) <= base.tolerance, "預設案例達到函數殘差條件");
    check(Math.abs(r.xr - Math.SQRT2) < 1e-4, "預設根接近 sqrt(2)");
    check(r.iterations === r.history.length, "實際迭代數與紀錄一致");
    check(r.history.slice(0,-1).every(row => Math.abs(row.fr) > base.tolerance), "首次達標即停止");
    for (const [functionId, xl, xu, expected] of [
      ["quadratic",1,2,1.4142135623730951],
      ["cubic",1,2,1.5213797068045676],
      ["cosine",0,1,0.7390851332151607]
    ]) {
      r=run({functionId,xl,xu,tolerance:1e-12,maxIterations:100});
      check(r.converged && Math.abs(r.fr)<=1e-12 && Math.abs(r.xr-expected)<1e-11, "高精度收斂 "+functionId);
    }
    r=run({maxIterations:5,tolerance:1e-12});
    const expected = [[1,2,1.5,.25],[1,1.5,1.25,-.4375],[1.25,1.5,1.375,-.109375],[1.375,1.5,1.4375,.06640625],[1.375,1.4375,1.40625,-.0224609375]];
    check(r.history.every((row,i)=>["xl","xu","xr","fr"].every((key,j)=>row[key]===expected[i][j])), "前五次與手算及既有 MATLAB 紀錄一致");
    check(!r.converged && r.reason==="max-iterations" && r.iterations===5, "迭代不足不宣稱成功");
    check(r.history.every(row=>{
      const fl=row.nextXl*row.nextXl-2,fu=row.nextXu*row.nextXu-2;
      return Math.sign(fl)!==Math.sign(fu) && row.nextXu-row.nextXl===(row.xu-row.xl)/2 && row.decision.length>0;
    }), "每次更新保留異號半區間並記錄判斷");
    r=run({maxIterations:1,tolerance:.25});
    check(r.converged && r.iterations===1, "殘差等於 tolerance 時成功");
    const rootValue=0.7390851332151607;
    for (const [xl,xu] of [[rootValue,1],[0,rootValue]]) {
      r=run({functionId:"cosine",xl,xu});
      check(r.converged && r.reason==="endpoint" && r.iterations===0 && r.xr===rootValue, "端點根 "+xl+","+xu);
    }
    rejects({xl:2,xu:3},"同號端點拒絕");
    rejects({xl:2,xu:1},"倒置區間拒絕");
    rejects({xl:1,xu:1},"零寬區間拒絕");
    for(const tolerance of [0,-1,NaN,Infinity,-Infinity,"0.1",null]) rejects({tolerance},"無效 tolerance "+String(tolerance));
    for(const maxIterations of [0,-1,1.5,1001,NaN,Infinity,"50"]) rejects({maxIterations},"無效 maxIterations "+String(maxIterations));
    for(const xl of [Infinity,-Infinity,NaN,undefined]) rejects({xl},"非有限下界 "+String(xl));
    rejects({xu:Infinity},"非有限上界拒絕");
    rejects({xl:1e200,xu:2e200},"函數溢位拒絕");
    rejects({functionId:"__proto__"},"未列出函數拒絕");
    r=run({xl:Math.SQRT2-Number.EPSILON,xu:Math.SQRT2,tolerance:Number.MIN_VALUE,maxIterations:1000});
    check(!r.converged && r.reason==="precision" && r.iterations===1, "相鄰浮點端點停滯不宣稱成功");
    r=run({functionId:"cosine",xl:-1e308,xu:1e308,maxIterations:2});
    check(r.history.every(row=>Number.isFinite(row.xr)&&Number.isFinite(row.fr)), "極大異號區間的中點不溢位");
    return { passed, defaultResult: run() };
  }
  if(typeof module!=="undefined" && module.exports) {
    module.exports=runCalculatorTests;
    if(require.main===module){
      const report=runCalculatorTests(require("../assets/js/calculators.js"));
      console.log(report.passed.map(t=>"PASS "+t).join("\n"));
      console.log("ALL "+report.passed.length+" CORE TESTS PASSED");
    }
  } else root.runCalculatorTests=runCalculatorTests;
})(globalThis);
