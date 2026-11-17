function test_matlab_transforms
% 於專案根目錄執行 addpath('scripts'); test_matlab_transforms
root=fileparts(fileparts(mfilename('fullpath')));
p=jsondecode(fileread(fullfile(root,'data','packs','laplace-transform','laplace-transform.json')));
q=jsondecode(fileread(fullfile(root,'data','packs','fourier-transform','fourier-transform.json')));
r=run_code(p.matlab_code);
assert(abs(r.F-(.3-.1i))<1e-12 && r.difference<1e-8);
disp('PASS MATLAB Laplace exponential s=1+j');
code=strrep(p.matlab_code,'omega = 1;','omega = 0;');
r=run_code(code);assert(abs(r.F-1/3)<1e-12);
disp('PASS MATLAB Laplace exponential s=1');
code=strrep(code,'functionId = ''exponential'';','functionId = ''sine'';');
r=run_code(code);assert(abs(r.F-.4)<1e-12);
disp('PASS MATLAB Laplace sine');
for item={'constant','ramp'}
    code=strrep(p.matlab_code,'functionId = ''exponential'';',['functionId = ''' item{1} ''';']);
    r=run_code(code);
    if strcmp(item{1},'constant'), expected=.5-.5i; else, expected=-.5i; end
    assert(abs(r.F-expected)<1e-12);
    disp(['PASS MATLAB Laplace ' item{1}]);
end
assert_reject(strrep(p.matlab_code,'sigma = 1;','sigma = -2;'),'Laplace:ROC');
assert_reject(strrep(p.matlab_code,'sigma = 1;','sigma = -3;'),'Laplace:ROC');
code=strrep(p.matlab_code,'functionId = ''exponential'';','functionId = ''sine'';');
assert_reject(strrep(code,'b = 2;','b = 0;'),'');
r=run_code(q.matlab_code);assert(abs(r.F-6)<1e-12 && r.magnitude==6);
disp('PASS MATLAB Fourier rectangle omega=0');
code=strrep(q.matlab_code,'omega = 0;','omega = pi/3;');
r=run_code(code);assert(abs(r.F-12/pi)<1e-12);
disp('PASS MATLAB Fourier rectangle nonzero frequency');
for item={'exponential','gaussian'}
    code=strrep(q.matlab_code,'functionId = ''rectangle'';',['functionId = ''' item{1} ''';']);
    r=run_code(code);
    if strcmp(item{1},'exponential'), expected=2; else, expected=sqrt(pi); end
    assert(abs(r.F-expected)<1e-12 && r.difference<1e-8);
    disp(['PASS MATLAB Fourier ' item{1} ' omega=0']);
end
code=strrep(q.matlab_code,'functionId = ''rectangle'';','functionId = ''exponential'';');
code=strrep(code,'omega = 0;','omega = 1;');
r=run_code(code);assert(abs(r.F-1)<1e-12);
disp('PASS MATLAB Fourier exponential omega=1');
assert_reject(strrep(code,'a = 1;','a = 0;'),'');
assert_reject(strrep(q.matlab_code,'T = 3;','T = 0;'),'');
disp('ALL MATLAB TRANSFORM CHECKS PASSED');
end
function out=run_code(code)
% 隔離每份教材程式的變數。
F=NaN;Fq=NaN;difference=NaN;magnitude=NaN;
eval(code);
out=struct('F',F,'Fq',Fq,'difference',difference,'magnitude',magnitude);
end
function assert_reject(code,identifier)
caught=false;
try
    run_code(code);
catch exception
    caught=true;
    if ~isempty(identifier),assert(strcmp(exception.identifier,identifier));end
end
assert(caught,'Expected invalid input rejection.');
disp(['PASS MATLAB rejection ' identifier]);
end
