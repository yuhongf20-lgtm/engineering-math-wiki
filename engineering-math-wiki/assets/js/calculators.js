"use strict";

// Pure numerical logic: no DOM, input parsing, or user-supplied executable code.
(function (root) {
  const MAX_ITERATIONS = 1000;
  const functions = Object.freeze([
    Object.freeze({ id: "quadratic", label: "f(x) = x^2 - 2", evaluate: (x) => x * x - 2 }),
    Object.freeze({ id: "cubic", label: "f(x) = x^3 - x - 2", evaluate: (x) => x * x * x - x - 2 }),
    Object.freeze({ id: "cosine", label: "f(x) = cos(x) - x", evaluate: (x) => Math.cos(x) - x })
  ]);

  function bisection({ functionId = "quadratic", xl, xu, tolerance, maxIterations } = {}) {
    const selected = functions.find((item) => item.id === functionId);
    if (!selected) throw new Error("請選擇已提供的固定函數。");
    for (const [name, value] of Object.entries({ xl, xu, tolerance, maxIterations })) {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(name + " 必須是有限數值。");
      }
    }
    if (xl >= xu) throw new Error("初始區間必須符合 xl < xu。");
    if (tolerance <= 0) throw new Error("容許誤差 tolerance 必須大於 0。");
    if (!Number.isInteger(maxIterations) || maxIterations < 1 || maxIterations > MAX_ITERATIONS) {
      throw new Error("maxIterations 必須是 1 至 " + MAX_ITERATIONS + " 的正整數。");
    }
    const f = (x) => {
      const value = selected.evaluate(x);
      if (!Number.isFinite(value)) throw new Error("函數值不是有限數值，請縮小輸入範圍。");
      return value;
    };
    let fl = f(xl);
    const fu = f(xu);
    const history = [];
    const result = (xr, fr, converged, reason) => ({
      xr, fr, converged, reason, iterations: history.length, history
    });
    // All three fixed functions are continuous on every finite real interval.
    // Endpoint roots must be checked before the strict sign-change test.
    if (fl === 0) return result(xl, fl, true, "endpoint");
    if (fu === 0) return result(xu, fu, true, "endpoint");
    if (Math.sign(fl) === Math.sign(fu)) {
      throw new Error("端點函數值同號，區間不符合異號包根條件；請重新選擇區間。");
    }
    for (let iteration = 1; iteration <= maxIterations; iteration++) {
      // Avoid overflow both for same-sign large bounds and opposite-sign bounds.
      const xr = xl < 0 && xu > 0 ? xl / 2 + xu / 2 : xl + (xu - xl) / 2;
      if (!Number.isFinite(xr)) throw new Error("中點不是有限數值。");
      const fr = f(xr);
      const row = { iteration, xl, xu, xr, fr, decision: "", nextXl: xl, nextXu: xu };
      history.push(row);
      if (Math.abs(fr) <= tolerance) {
        row.decision = "|f(xr)| <= tolerance，達到停止條件；不再更新區間。";
        return result(xr, fr, true, "residual");
      }
      if (xr === xl || xr === xu) {
        row.decision = "中點等於端點，浮點精度限制使區間無法再縮小。";
        return result(xr, fr, false, "precision");
      }
      if (Math.sign(fl) !== Math.sign(fr)) {
        row.decision = "f(xl) 與 f(xr) 異號，保留 [xl, xr]，令 xu = xr。";
        xu = xr;
      } else {
        row.decision = "f(xl) 與 f(xr) 同號，保留 [xr, xu]，令 xl = xr。";
        xl = xr;
        fl = fr;
      }
      row.nextXl = xl;
      row.nextXu = xu;
      if (iteration === maxIterations) return result(xr, fr, false, "max-iterations");
    }
  }


  const DERIVATIVE_EPSILON = 1e-12;
  const newtonFunctions = Object.freeze([
    Object.freeze({ id: "quadratic", label: "f(x) = x^2 - 2", derivativeLabel: "f'(x) = 2x", evaluate: (x) => x*x-2, derivative: (x) => 2*x }),
    Object.freeze({ id: "cubic", label: "f(x) = x^3 - x - 2", derivativeLabel: "f'(x) = 3x^2 - 1", evaluate: (x) => x*x*x-x-2, derivative: (x) => 3*x*x-1 }),
    Object.freeze({ id: "cosine", label: "f(x) = cos(x) - x", derivativeLabel: "f'(x) = -sin(x) - 1", evaluate: (x) => Math.cos(x)-x, derivative: (x) => -Math.sin(x)-1 })
  ]);

  function newtonRaphson({ functionId = "quadratic", x0, tolerance, maxIterations } = {}) {
    const selected = newtonFunctions.find((item) => item.id === functionId);
    if (!selected) throw new Error("請選擇已提供的固定函數。");
    for (const [name, value] of Object.entries({ x0, tolerance, maxIterations })) {
      if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(name + " 必須是有限數值。");
    }
    if (tolerance <= 0) throw new Error("tolerance 必須大於 0。");
    if (!Number.isInteger(maxIterations) || maxIterations < 1 || maxIterations > MAX_ITERATIONS) {
      throw new Error("maxIterations 必須是 1 至 " + MAX_ITERATIONS + " 的正整數。");
    }
    let x = x0;
    let fx = selected.evaluate(x);
    const history = [];
    const result = (converged, reason, message) => ({
      xr: x, fr: fx, iterations: history.length, converged, reason, message, history
    });
    if (!Number.isFinite(fx)) return result(false, "non-finite", "初始函數值不是有限數值，請改用其他初始值。");
    // A satisfactory initial residual needs no Newton updates or division.
    if (Math.abs(fx) <= tolerance) return result(true, "initial", "初始值已符合函數殘差條件。");
    for (let iteration = 1; iteration <= maxIterations; iteration++) {
      const dfx = selected.derivative(x);
      if (!Number.isFinite(dfx)) return result(false, "non-finite", "導數不是有限數值，計算失敗。");
      if (Math.abs(dfx) <= DERIVATIVE_EPSILON) {
        return result(false, "derivative", "導數為零或接近零（|f'(x)| <= 1e-12），無法安全進行下一次更新。");
      }
      const xNext = x - fx / dfx;
      if (!Number.isFinite(xNext)) return result(false, "non-finite", "下一次近似值不是有限數值，計算失敗。");
      const fNext = selected.evaluate(xNext);
      if (!Number.isFinite(fNext)) return result(false, "non-finite", "下一次函數值不是有限數值，計算失敗。");
      history.push({ iteration, x, fx, dfx, xNext });
      const stalled = xNext === x;
      x = xNext;
      fx = fNext;
      if (Math.abs(fx) <= tolerance) return result(true, "residual", "已符合函數殘差條件。");
      if (stalled) return result(false, "precision", "浮點數精度限制使 x_next 等於 x，但函數殘差尚未達標。");
    }
    return result(false, "max-iterations", "已達最大迭代次數；可能不收斂，請檢查初始值與函數。");
  }


  function finiteNumber(value, name) {
    if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(name + " 必須是有限數值。");
  }

  function iterationOptions(tolerance, maxIterations) {
    finiteNumber(tolerance, "tolerance");
    finiteNumber(maxIterations, "maxIterations");
    if (tolerance <= 0) throw new Error("tolerance 必須大於 0。");
    if (!Number.isInteger(maxIterations) || maxIterations < 1 || maxIterations > MAX_ITERATIONS) {
      throw new Error("maxIterations 必須是 1 至 " + MAX_ITERATIONS + " 的正整數。");
    }
  }

  function falsePosition({ functionId = "quadratic", xl, xu, tolerance, maxIterations } = {}) {
    const selected = functions.find((item) => item.id === functionId);
    if (!selected) throw new Error("請選擇已提供的固定函數。");
    finiteNumber(xl, "xl"); finiteNumber(xu, "xu");
    iterationOptions(tolerance, maxIterations);
    if (xl >= xu) throw new Error("初始區間必須符合 xl < xu。");
    const f = (x) => { const value = selected.evaluate(x); finiteNumber(value, "函數值"); return value; };
    let fl = f(xl), fu = f(xu);
    const history = [];
    const result = (xr, fr, converged, reason) => ({ xr, fr, converged, reason, iterations: history.length, history });
    if (fl === 0) return result(xl, fl, true, "endpoint");
    if (fu === 0) return result(xu, fu, true, "endpoint");
    if (Math.sign(fl) === Math.sign(fu)) throw new Error("端點函數值同號，不符合異號包根條件。");
    for (let iteration = 1; iteration <= maxIterations; iteration++) {
      const denominator = fl - fu;
      const threshold = 8 * Number.EPSILON * Math.max(1, Math.abs(fl), Math.abs(fu));
      if (!Number.isFinite(denominator) || Math.abs(denominator) <= threshold) {
        throw new Error("假位法插值分母非有限值或接近零，無法安全計算。");
      }
      const xr = xu - fu * (xl - xu) / denominator;
      finiteNumber(xr, "插值點 xr");
      const fr = f(xr);
      const row = { iteration, xl, xu, xr, fr, nextXl: xl, nextXu: xu, decision: "" };
      history.push(row);
      if (Math.abs(fr) <= tolerance) {
        row.decision = "|f(xr)| <= tolerance，達標停止，不再更新區間。";
        return result(xr, fr, true, "residual");
      }
      if (xr <= xl || xr >= xu) {
        row.decision = "插值點等於端點或超出區間，浮點精度無法繼續。";
        return result(xr, fr, false, "precision");
      }
      if (Math.sign(fl) !== Math.sign(fr)) {
        xu = xr; fu = fr;
        row.decision = "f(xl) 與 f(xr) 異號，保留 [xl, xr]，令 xu = xr。";
      } else {
        xl = xr; fl = fr;
        row.decision = "f(xl) 與 f(xr) 同號，保留 [xr, xu]，令 xl = xr。";
      }
      row.nextXl = xl; row.nextXu = xu;
      if (iteration === maxIterations) return result(xr, fr, false, "max-iterations");
    }
  }

  function validateSystem(A, b) {
    if (!Array.isArray(A) || ![2,3].includes(A.length) ||
        !A.every((row) => Array.isArray(row) && row.length === A.length) ||
        !Array.isArray(b) || b.length !== A.length) {
      throw new Error("A 必須為 2×2 或 3×3，b 必須有相同數量的分量。");
    }
    A.forEach((row,i) => row.forEach((v,j) => finiteNumber(v, "A["+(i+1)+","+(j+1)+"]")));
    b.forEach((v,i) => finiteNumber(v, "b"+(i+1)));
    return { A: A.map((row) => row.slice()), b: b.slice(), n: A.length };
  }

  function linearResidual(A, b, x) {
    const vector = A.map((row,i) => b[i] - row.reduce((sum,a,j) => sum+a*x[j],0));
    vector.forEach((v) => finiteNumber(v,"殘差"));
    return { vector, norm: Math.max(...vector.map(Math.abs)) };
  }

  function directLinear({ A, b } = {}, jordan = false) {
    const system = validateSystem(A,b);
    const n = system.n;
    const M = system.A.map((row,i) => [...row,system.b[i]]);
    const steps = [];
    const backSubstitution = [];
    const snapshot = (description) => {
      if (!M.every((row) => row.every(Number.isFinite))) throw new Error("列運算產生非有限值，計算失敗。");
      steps.push({ description, matrix: M.map((row) => row.slice()) });
    };
    snapshot("原始增廣矩陣 [A | b]");
    const scale = Math.max(...system.A.flat().map(Math.abs));
    const pivotTolerance = Math.max(Number.MIN_VALUE, scale * 1e-12);
    const singular = () => ({
      success: false, x: null, residual: null, steps, backSubstitution, reason: "singular",
      message: "找不到安全主元：矩陣奇異或數值近奇異，無法判定唯一解；不輸出唯一答案。"
    });
    if (scale === 0) return singular();
    for (let k=0; k<n; k++) {
      let p=k;
      for (let i=k+1;i<n;i++) if (Math.abs(M[i][k])>Math.abs(M[p][k])) p=i;
      if (Math.abs(M[p][k])<=pivotTolerance) return singular();
      if (p!==k) {
        [M[k],M[p]]=[M[p],M[k]];
        snapshot("部分選主元：R"+(k+1)+" ↔ R"+(p+1));
      }
      if (jordan) {
        const pivot=M[k][k];
        M[k]=M[k].map((v)=>v/pivot);
        snapshot("R"+(k+1)+" <- R"+(k+1)+" / ("+pivot+")，主元化為 1");
      }
      for (let i=jordan?0:k+1;i<n;i++) {
        if (i===k || M[i][k]===0) continue;
        const multiplier=jordan?M[i][k]:M[i][k]/M[k][k];
        finiteNumber(multiplier,"消去倍數");
        for (let j=k;j<=n;j++) M[i][j]-=multiplier*M[k][j];
        M[i][k]=0;
        snapshot("R"+(i+1)+" <- R"+(i+1)+" - ("+multiplier+") * R"+(k+1));
      }
    }
    const x=Array(n).fill(0);
    if (jordan) {
      for(let i=0;i<n;i++) x[i]=M[i][n];
    } else {
      for(let i=n-1;i>=0;i--) {
        let sum=0;
        for(let j=i+1;j<n;j++) sum+=M[i][j]*x[j];
        x[i]=(M[i][n]-sum)/M[i][i];
        finiteNumber(x[i],"回代結果");
        backSubstitution.push({ variable:i+1,value:x[i],
          description:"x"+(i+1)+" = ("+M[i][n]+" - ("+sum+")) / ("+M[i][i]+") = "+x[i] });
      }
    }
    x.forEach((v)=>finiteNumber(v,"解分量"));
    const residual=linearResidual(system.A,system.b,x);
    return { success:true, x, residual, steps, backSubstitution, reason:"solved",
      message:"已完成"+(jordan?"增廣矩陣化簡，可讀出唯一數值解。":"向前消去與向後代入。")+"殘差小不直接保證病態系統的解誤差小。" };
  }

  function gaussianElimination(parameters) { return directLinear(parameters,false); }
  function gaussJordan(parameters) { return directLinear(parameters,true); }

  function gaussSeidel({ A,b,x0,tolerance,maxIterations } = {}) {
    const system=validateSystem(A,b);
    iterationOptions(tolerance,maxIterations);
    if (!Array.isArray(x0) || x0.length!==system.n) throw new Error("初始向量 x0 的長度必須與矩陣一致。");
    x0.forEach((v)=>finiteNumber(v,"初始向量"));
    const scale=Math.max(...system.A.flat().map(Math.abs));
    const threshold=Math.max(Number.MIN_VALUE,scale*1e-12);
    if (system.A.some((row,i)=>Math.abs(row[i])<=threshold)) {
      throw new Error("對角元素為零或數值過小，無法安全執行 Gauss-Seidel。");
    }
    const diagonallyDominant=system.A.every((row,i)=>Math.abs(row[i])>row.reduce((s,v,j)=>s+(i===j?0:Math.abs(v)),0));
    let x=x0.slice();
    let residual=linearResidual(system.A,system.b,x);
    const initialResidual=residual.norm;
    const history=[];
    const result=(converged,reason,message)=>({x:x.slice(),residual,iterations:history.length,history,converged,reason,message,diagonallyDominant});
    // Do not label a singular system's residual solution as a unique solution.
    if (!gaussianElimination({A:system.A,b:system.b}).success) {
      return result(false,"singular","矩陣奇異或數值近奇異，本唯一解計算器停止。");
    }
    if (residual.norm<=tolerance) return result(true,"initial","初始殘差已達標。");
    let growthCount=0;
    for(let iteration=1;iteration<=maxIterations;iteration++) {
      const next=x.slice();
      for(let i=0;i<system.n;i++) {
        let sum=0;
        for(let j=0;j<system.n;j++) if(j!==i) sum+=system.A[i][j]*(j<i?next[j]:x[j]);
        next[i]=(system.b[i]-sum)/system.A[i][i];
      }
      if (!next.every(Number.isFinite)) return result(false,"non-finite","迭代產生非有限值，計算失敗。");
      let nextResidual;
      try { nextResidual=linearResidual(system.A,system.b,next); }
      catch { return result(false,"non-finite","殘差產生非有限值，計算失敗。"); }
      growthCount=nextResidual.norm>residual.norm*1.2?growthCount+1:0;
      const stalled=next.every((v,i)=>v===x[i]);
      x=next;residual=nextResidual;
      history.push({iteration,x:x.slice(),residual:residual.norm});
      if(residual.norm<=tolerance) return result(true,"residual","原方程組殘差已達標。");
      if(stalled) return result(false,"precision","浮點停滯，但殘差尚未達標。");
      if(growthCount>=8 && residual.norm>100*Math.max(1,initialResidual)) {
        return result(false,"diverging","殘差持續快速增長，疑似發散，已觸發數值保護停止；這不是一般性發散證明。");
      }
    }
    return result(false,"max-iterations","已達最大迭代次數，尚未收斂至指定條件。");
  }


  const laplaceFunctions = Object.freeze([
    Object.freeze({id:"constant",label:"f(t) = 1"}),
    Object.freeze({id:"ramp",label:"f(t) = t"}),
    Object.freeze({id:"exponential",label:"f(t) = e^(-at)"}),
    Object.freeze({id:"sine",label:"f(t) = sin(bt)，b > 0"})
  ]);
  const fourierFunctions = Object.freeze([
    Object.freeze({id:"exponential",label:"f(t) = e^(-a|t|)，a > 0"}),
    Object.freeze({id:"gaussian",label:"f(t) = e^(-at^2)，a > 0"}),
    Object.freeze({id:"rectangle",label:"矩形脈衝：f(t) = A，|t| <= T/2"})
  ]);

  function complexText(real,imag) {
    const re=real===0?0:real,im=imag===0?0:imag;
    return String(re)+(im<0?" - ":" + ")+String(Math.abs(im))+"j";
  }

  // Divide a real numerator by a complex denominator, using scaling to
  // avoid unnecessary squaring overflow. Every arithmetic result is checked.
  function complexQuotient(numerator, real, imag) {
    [numerator,real,imag].forEach(v=>finiteNumber(v,"複數運算輸入"));
    const scale=Math.max(Math.abs(real),Math.abs(imag));
    if(scale===0)throw new Error("複數分母為零，無法計算。");
    const u=real/scale,v=imag/scale,den=u*u+v*v,factor=numerator/scale;
    const re=factor*u/den,im=-factor*v/den;
    finiteNumber(re,"結果實部");finiteNumber(im,"結果虛部");
    return {real:re===0?0:re,imag:im===0?0:im};
  }

  function laplaceTransform({functionId="exponential",a=2,b=2,sigma=1,omega=1}={}) {
    if(!laplaceFunctions.some(item=>item.id===functionId))throw new Error("請選擇已支援的拉普拉斯函數。");
    finiteNumber(sigma,"σ");finiteNumber(omega,"ω");
    let boundary=0,formula,functionText;
    if(functionId==="exponential"){
      finiteNumber(a,"a");boundary=-a;
      formula="F(s) = 1/(s+a)";functionText="f(t) = e^(-("+a+")t)，t >= 0";
    }else if(functionId==="sine"){
      finiteNumber(b,"b");if(b<=0)throw new Error("sin(bt) 的 b 必須大於 0。");
      formula="F(s) = b/(s^2+b^2)";functionText="f(t) = sin(("+b+")t)，t >= 0";
    }else{
      formula=functionId==="constant"?"F(s) = 1/s":"F(s) = 1/s^2";
      functionText=functionId==="constant"?"f(t) = 1，t >= 0":"f(t) = t，t >= 0";
    }
    const roc="Re(s) > "+(boundary===0?0:boundary);
    const info={functionText,formula,roc,s:complexText(sigma,omega)};
    // Never evaluate an analytic continuation as an integral value outside ROC.
    if(!(sigma>boundary))return {...info,valid:false,real:null,imag:null,complex:null,
      substitution:"σ = "+sigma+" 不滿足 "+roc,
      steps:["先檢查 ROC。","拉普拉斯積分不收斂；解析式即使能代入，也不是此積分的有效轉換值。"]};
    let denominatorReal=sigma,denominatorImag=omega,numerator=1,substitution;
    const steps=["單邊轉換使用 t >= 0；s = σ+jω = "+info.s+"。","σ = "+sigma+" 滿足 ROC："+roc+"。"];
    if(functionId==="exponential"){
      denominatorReal=sigma+a;
      substitution="F("+info.s+") = 1/(("+info.s+") + ("+a+"))";
    }else if(functionId==="ramp"||functionId==="sine"){
      const squareReal=sigma*sigma-omega*omega,squareImag=2*sigma*omega;
      denominatorReal=squareReal+(functionId==="sine"?b*b:0);
      denominatorImag=squareImag;
      numerator=functionId==="sine"?b:1;
      steps.push("s^2 = (σ^2-ω^2)+j(2σω) = "+complexText(squareReal,squareImag)+"。");
      substitution=functionId==="sine"?"F(s) = "+b+"/(("+info.s+")^2 + "+b+"^2)":"F(s) = 1/(("+info.s+")^2)";
    }else substitution="F(s) = 1/("+info.s+")";
    const value=complexQuotient(numerator,denominatorReal,denominatorImag);
    steps.push("分母 = "+complexText(denominatorReal,denominatorImag)+"；以共軛除法求實部與虛部（程式以縮放避免不必要溢位）。");
    return {...info,...value,valid:true,complex:complexText(value.real,value.imag),substitution,steps};
  }

  function fourierTransform({functionId="exponential",a=1,A=2,T=3,omega=0}={}) {
    if(!fourierFunctions.some(item=>item.id===functionId))throw new Error("請選擇已支援的傅立葉函數。");
    finiteNumber(omega,"角頻率 ω");
    let value,functionText,formula,substitution,conditions;
    const steps=["採雙邊 F(ω)=∫[-∞,∞] f(t)e^(-jωt) dt；反轉換係數為 1/(2π)。",
      "ω = "+omega+" rad/s；與一般頻率 ν（Hz）的關係為 ω=2πν。"];
    if(functionId==="rectangle"){
      finiteNumber(A,"A");finiteNumber(T,"T");
      if(T<=0)throw new Error("矩形脈衝寬度 T 必須大於 0。");
      functionText="f(t) = "+A+"，|t| <= "+T+"/2；其他時間為 0";
      formula="F(ω) = 2A*sin(ωT/2)/ω（ω != 0）；F(0) = AT";
      conditions="A 為有限實數，T > 0；矩形脈衝絕對可積。端點取值不影響積分。";
      if(omega===0){
        value=A*T;substitution="F(0) = A*T = "+A+"*"+T;
        steps.push("ω=0 時直接使用 sin(z)/z -> 1 的極限，避免 0/0。");
      }else{
        const z=omega*(T/2);finiteNumber(z,"ωT/2");
        const sinc=Math.abs(z)<1e-4?1-z*z/6+z*z*z*z/120:Math.sin(z)/z;
        value=(A*T)*sinc;
        substitution="F("+omega+") = "+A+"*"+T+"*sin("+z+")/("+z+")";
        steps.push("以 AT*(sin(z)/z)、z=ωT/2 計算；非常接近零時使用級數以減少數值誤差。");
      }
    }else{
      finiteNumber(a,"a");if(a<=0)throw new Error("a 必須大於 0，才能保證此函數絕對可積。");
      conditions="a > 0；對所有實數角頻率 ω，函數絕對可積。";
      if(functionId==="exponential"){
        functionText="f(t) = e^(-("+a+")|t|)";
        formula="F(ω) = 2a/(a^2+ω^2)";
        const scale=Math.max(a,Math.abs(omega)),u=a/scale,v=omega/scale;
        value=(2*u/(u*u+v*v))/scale;
        substitution="F("+omega+") = 2*"+a+"/("+a+"^2 + ("+omega+")^2)";
        steps.push("利用偶函數對稱性，虛部的奇函數積分互相抵消；對正半軸積分後乘 2。");
      }else{
        functionText="f(t) = e^(-("+a+")t^2)";
        formula="F(ω) = sqrt(π/a)*exp(-ω^2/(4a))";
        const q=omega/(2*Math.sqrt(a));
        value=(Math.sqrt(Math.PI)/Math.sqrt(a))*Math.exp(-q*q);
        substitution="F("+omega+") = sqrt(π/"+a+")*exp(-("+omega+")^2/(4*"+a+"))";
        steps.push("套用高斯積分的轉換對；時域高斯仍對應頻域高斯。");
      }
    }
    finiteNumber(value,"傅立葉轉換結果");
    value=value===0?0:value;
    steps.push("三個選項均為實偶函數，因此結果為實數、虛部為 0；幅度為絕對值。數值仍受雙精度捨入及下溢限制。");
    return {valid:true,functionText,formula,substitution,conditions,value,real:value,imag:0,magnitude:Math.abs(value),steps};
  }

  const api = Object.freeze({ functions, MAX_ITERATIONS, bisection, newtonFunctions, DERIVATIVE_EPSILON, newtonRaphson, falsePosition, gaussianElimination, gaussJordan, gaussSeidel, laplaceFunctions, fourierFunctions, laplaceTransform, fourierTransform });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MathCalculators = api;
})(globalThis);
