window.fetchy = new Proxy(window.fetch, {
    apply: async (target, that, args)=>{
        // args holds argument of fetch function. Do whatever you want with fetch request
        let oret={req:{},res:{}};
        let req_heads;
        args.forEach((arg,i) => {
            if(typeof(arg)=="string" && i==0){ oret.url=arg; }
            else if(typeof(arg)=="object"){
                if(arg.headers){ req_heads=arg.headers; }
                else{  console.log('obj arg',arg); }
            }else{ console.log('args',typeof(arg),arg); }
        });
        const temp=await target.apply(that, args);
        oret.code=temp.status;
        oret.status=temp.statusText;
        oret.req.header=req_heads;
        
        oret.res.contentType=temp.headers.get("Content-Type").split(";")[0];
        if(oret.res.contentType=='application/json'){
            oret.result=await temp.json();
        }else if(oret.res.contentType=='text/html'){
            var dom=document.createElement('div');
            const t=await temp.text();
            dom.innerHTML= t.replace(/<\!--.*?-->/g, "");
            rm_el(dom,['script','link','style']);
            oret.result= dom.innerText.replace(/\n/g,"").replace(/\t/g," ").replace(/\s+/g," ").trim();
            oret.res.result= dom;
        } else{
            const t=await temp.text();
            oret.result= t;
        }
        return oret;
    },
});

window.fetch=undefined;
// fetch('http://localhost/~heriawan/0gogs/Reborn/setting/orgs?page=&id>a',{
//     headers: { "Accept": "application/json", },
// }).then((response) => {
//     var x=response;
//     console.log('fetch',x)
// });

const request={
    params:{
        method: "GET", 
        headers: { "Content-Type": "application/json" },
    },
    get:(...args)=>{
        let p=request.params;
        let url=args[0];
        if(args[1]!=undefined && typeof(args[1])=="object"){
            p.headers=Object.assign(p.headers,args[1]);
        }
        if(args[2]!=undefined && typeof(args[2])=="object"){
            var q=new URLSearchParams(args[2]).toString()
            url= args[0].indexOf('?')>0 ? `${args[0]}&${q}` : `${args[0]}?${q}`;
        } return fetchy(url,p);
    },
    post:(...args)=>{
        let p=request.params; p.method="POST";
        let url=args[0];
        if(args[1]!=undefined && typeof(args[1])=="object"){
            p.headers=Object.assign(p.headers,args[1]);
        }
        if(args[2]!=undefined && typeof(args[2])=="object"){
            p.body= JSON.stringify(args[2])
        } return fetchy(url,p);
    },
    patch:(...args)=>{
        let p=request.params; p.method="PATCH";
        let url=args[0];
        if(args[1]!=undefined && typeof(args[1])=="object"){
            p.headers=Object.assign(p.headers,args[1]);
        }
        if(args[2]!=undefined && typeof(args[2])=="object"){
            p.body= JSON.stringify(args[2])
        } return fetchy(url,p);
    }
};
/*
rm -rf .git
git init -b main
git add .
git commit -m "Repub Repo"
git remote add origin github.com/linheriawan/linheriawan.github.io.git
git remote set-url origin https://github.com/linheriawan/linheriawan.github.io.git
git push -u --force origin main
 */
