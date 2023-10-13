const rm_el=(parentelement,selector)=>{
    if(typeof(selector)=="object"){
        selector.forEach((s,si)=>{
            parentelement.querySelectorAll(s).forEach((el,i)=>{ el.remove(); });        
        });
    }else{ parentelement.querySelectorAll(selector).forEach((el,i)=>{ el.remove(); }); }
}
const dump=(x)=>{
    var v=Object.keys({x}); console.log(v,`:${x}`);
}
const mkParallax = (prm)=>{
    var windowHeight = window.innerHeight, 
    windowHeightExtra = 0, 
    safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
    mobile = /Mobi/.test(navigator.userAgent);
    dump(windowHeight);
    safari && 
    !mobile && 
    (windowHeightExtra = window.outerHeight - window.innerHeight),
    mobile && (
        windowHeight = window.screen.availHeight,
        windowHeightExtra = (window.screen.availHeight - window.innerHeight) / 2
    );

    let PLX={
        par:{ speed: 1.5, className: "prlx"},
        paraPos: (e, t, a, i) =>{
            var n = e.top / t - windowHeightExtra;
            a[i].style.top = n + "px"
        }, paraAnim : (e, t) => {
            for (var a = 0; e.length > a; a++) {
                var i = e[a].parentElement.parentElement.getBoundingClientRect();
                0 <= i.top + i.height && i.top <= windowHeight && PLX.paraPos(i, t, e, a)
            }
        }, hgCalc: (e, t) => {
            for (var a = 0; e.length > a; a++) {
                var i = e[a].parentElement.parentElement.getBoundingClientRect(), 
                n = e[a].parentElement.parentElement.offsetTop, 
                o = (windowHeight - i.height) / 2,
                r = windowHeight > i.height + n 
                    ? i.height + n - n / t 
                    : i.height + 2 * (o - o / t);
                e[a].style.height = r + 2 * windowHeightExtra + "px",
                PLX.paraPos(i, t, e, a)
            }
        }, init: ()=>{
            for (var n = document.getElementsByClassName(PLX.par.className), e = 0; n.length > e; e++) {
                var t = document.createElement("div");
                n[e].parentNode.insertBefore(t, n[e]),
                t.appendChild(n[e]);
                var a = n[e].parentElement;
                a.className += `${PLX.par.className}__cont`,
                "relative" !== window.getComputedStyle(a.parentElement, null).getPropertyValue("position") && (a.parentElement.style.position = "relative");
                var o = n[e].dataset.imgSrc;
                void 0 !== o && (n[e].style.backgroundImage = `url(${o})`,
                1 === n[e].classList.length && PLX.par.className === n[e].classList[0] && (n[e].style.backgroundRepeat = "no-repeat",
                n[e].style.backgroundPosition = "center",
                n[e].style.backgroundSize = "cover"))
            }
            document.addEventListener("readystatechange", (e) => {
                var t, a;
                "complete" === e.target.readyState && (
                    t = n,
                    (a = PLX.par.speed) < 1 && (a = 1),
                    PLX.hgCalc(t, a),
                    mobile || window.addEventListener("resize", () => {
                        windowHeight = window.innerHeight,
                        PLX.hgCalc(t, a)
                    }),
                    window.addEventListener("scroll", ()=>{ PLX.paraAnim(t, a) })
                )
            })
        }
    };
    PLX.par=Object.assign(PLX.par,prm);
    PLX.init();
};
document.addEventListener("DOMContentLoaded", ()=>{
    mkParallax({ speed: 3 });	
    document.querySelectorAll("[href^='#']").forEach(x=>{
        x.addEventListener('click',e=>{
            try{
                var to=e.target.href.split("#")[1];
                console.log(`doing scroll to "${to}"`)
                document.getElementById(to).scrollIntoView({behavior: "smooth"});
                e.preventDefault();
            }catch(xc){ }
        });
    });
});