function test_matlab_packs
% 從專案資料包讀取原始 MATLAB 教材並實際執行。
% 使用方式：於專案根目錄執行 addpath('scripts'); test_matlab_packs
root = fileparts(fileparts(mfilename('fullpath')));
fp = jsondecode(fileread(fullfile(root,'data','packs','root-finding','false-position.json')));
ge = jsondecode(fileread(fullfile(root,'data','packs','linear-systems','gaussian-elimination.json')));
gj = jsondecode(fileread(fullfile(root,'data','packs','linear-systems','gauss-jordan.json')));
gs = jsondecode(fileread(fullfile(root,'data','packs','linear-systems','gauss-seidel.json')));
r = run_code(fp.matlab_code);
expected = [4/3;7/5;24/17;41/29;140/99;239/169];
assert(r.converged && size(r.history,1)==6 && abs(r.fr)<=1e-4);
assert(max(abs(r.history(:,4)-expected))<1e-12);
assert(max(abs(r.history(:,5)-(expected.^2-2)))<1e-12);
assert(all(abs(r.history(1:5,5))>1e-4));
disp('PASS MATLAB false-position six rows and residual');
assert_reject(strrep(fp.matlab_code,'xl = 1; xu = 2;','xl = 2; xu = 3;'),'FalsePosition:Bracket');
assert_reject(strrep(fp.matlab_code,'maxIterations = 100;','maxIterations = 1;'),'FalsePosition:MaxIterations');
assert_reject(strrep(fp.matlab_code,'tolerance = 1e-4;','tolerance = 0;'),'');
r = run_code(strrep(fp.matlab_code,'f = @(x) x.^2 - 2;','f = @(x) x - 1;'));
assert(r.converged && isempty(r.history) && r.xr==1);
disp('PASS MATLAB false-position endpoint root');
A = [0 2 1;2 1 1;1 1 3]; b = [7;7;12];
r = run_code(ge.matlab_code);
assert(norm(r.x-[1;2;3],inf)<1e-12 && norm(r.x-A\b,inf)<1e-12);
assert(norm(r.stages{2}-[2 1 1 7;0 2 1 7;0 .5 2.5 8.5],inf)<1e-12);
assert(norm(r.stages{3}-[2 1 1 7;0 2 1 7;0 0 2.25 6.75],inf)<1e-12);
disp('PASS MATLAB Gaussian pivot swap, stages, solution');
r = run_code(gj.matlab_code);
assert(norm(r.x-[1;2;3],inf)<1e-12 && norm(r.x-A\b,inf)<1e-12);
assert(norm(r.stages{2}-[1 .5 .5 3.5;0 2 1 7;0 .5 2.5 8.5],inf)<1e-12);
assert(norm(r.stages{3}-[1 0 .25 1.75;0 1 .5 3.5;0 0 2.25 6.75],inf)<1e-12);
assert(norm(r.stages{end}-rref([A,b]),inf)<1e-12);
disp('PASS MATLAB Gauss-Jordan stages and RREF');
for c = {ge.matlab_code,gj.matlab_code}
    bad = strrep(c{1},'A = [0 2 1; 2 1 1; 1 1 3];','A = [1 2;2 4];');
    for rhs = {'b = [3;6];','b = [3;7];'}
        assert_reject(strrep(bad,'b = [7;7;12];',rhs{1}),'Linear:Singular');
    end
    bad = strrep(c{1},'b = [7;7;12];','b = [1;2];');
    assert_reject(bad,'Linear:Dimensions');
end
r = run_code(gs.matlab_code);
expected = [1,3/2,5/3,5/3;2,13/12,35/18,5/18;3,73/72,215/108,5/108;4,433/432,1295/648,5/648];
assert(r.converged && size(r.history,1)==4 && max(abs(r.history-expected),[],'all')<1e-12);
assert(r.residual<=.01 && all(r.history(1:3,end)>.01));
assert(norm([6;8]-[4 1;2 3]*r.x,inf)<=.01);
disp('PASS MATLAB Gauss-Seidel four rows and residual');
assert_reject(strrep(gs.matlab_code,'maxIterations = 100;','maxIterations = 1;'),'GaussSeidel:MaxIterations');
assert_reject(strrep(gs.matlab_code,'A = [4 1;2 3];','A = [0 1;2 3];'),'GaussSeidel:Diagonal');
assert_reject(strrep(gs.matlab_code,'A = [4 1;2 3];','A = [1 2;2 4];'),'Linear:Singular');
bad = strrep(gs.matlab_code,'A = [4 1;2 3];','A = [1 2;2 1];');
bad = strrep(bad,'maxIterations = 100;','maxIterations = 3;');
assert_reject(bad,'GaussSeidel:MaxIterations');
assert_reject(strrep(gs.matlab_code,'x0 = [0;0];','x0 = [NaN;0];'),'');
disp('ALL FOUR MATLAB PACKS PASSED');
end

function out = run_code(code)
% 在獨立函式工作區執行教材，避免四份範例變數互相污染。
x=[]; xr=[]; fr=[]; history=[]; stages={}; residual=NaN; converged=[];
eval(code);
out=struct('x',x,'xr',xr,'fr',fr,'history',history,'stages',{stages},'residual',residual,'converged',converged);
end

function assert_reject(code,identifier)
caught=false;
try
    run_code(code);
catch exception
    caught=true;
    if ~isempty(identifier), assert(strcmp(exception.identifier,identifier)); end
end
assert(caught,'Expected failure was not reported.');
disp(['PASS MATLAB rejection: ' identifier]);
end
