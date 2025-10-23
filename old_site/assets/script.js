const rm_el=(parentelement,selector)=>{
    if(typeof(selector)=="object"){
        selector.forEach((s,si)=>{
            parentelement.querySelectorAll(s).forEach((el,i)=>{ el.remove(); });        
        });
    }else{ parentelement.querySelectorAll(selector).forEach((el,i)=>{ el.remove(); }); }
}
const mkParallax = (prm)=>{
    var windowHeight = window.innerHeight, 
        windowHeightExtra = 0, 
        safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
        mobile = /Mobi/.test(navigator.userAgent);
    
    safari &&  !mobile && 
        (windowHeightExtra = window.outerHeight - window.innerHeight),
    mobile && 
        (
            windowHeight = window.screen.availHeight,
            windowHeightExtra = (window.screen.availHeight - window.innerHeight) / 2
        );
    
    let PLX={
        par:{ speed: 1.5, className: "prlx"},
        hgCalc: (el) => {
            for (var x = 0; el.length > x; x++) {
                var i = el[x].parentElement.parentElement.getBoundingClientRect(), 
                speed=el[x].parentElement.getAttribute("speed"),
                n = el[x].parentElement.parentElement.offsetTop, 
                o = (windowHeight - i.height) / 2,
                r = windowHeight > i.height + n 
                    ? i.height + n - n / speed 
                    : i.height + 2 * (o - o / speed);
                el[x].style.height = r + 2 * windowHeightExtra + "px",
                PLX.paraPos(el[x], i, speed)
            }
        }, getScrollElm:(node)=>{
            if (node == null) { return null; }
            if (node.scrollHeight > node.clientHeight) { return node; } 
            else { return PLX.getScrollElm(node.parentNode); }
        }, init: (el)=>{
            for (x = 0; x < el.length; x++) {
                var t = document.createElement("div");
                el[x].parentNode.insertBefore(t, el[x]),
                t.appendChild(el[x]);
                var a = el[x].parentElement;
                a.className += `${PLX.par.className}__cont`,
                a.setAttribute('speed',el[x].dataset.speed==void 0?PLX.par.speed:el[x].dataset.speed),
                "relative" !== window.getComputedStyle(a.parentElement, null).getPropertyValue("position") && 
                    (a.parentElement.style.position = "relative");
                var o = el[x].dataset.imgSrc;
                el[x].removeAttribute('data-speed'),el[x].removeAttribute('data-img-src');
                void 0 !== o && 
                (
                    el[x].style.backgroundImage = `url(${o})`,
                    1 === el[x].classList.length && PLX.par.className === el[x].classList[0] && 
                    (   el[x].style.backgroundRepeat = "no-repeat",
                        el[x].style.backgroundPosition = "center",
                        el[x].style.backgroundSize = "cover")
                )
            }
            document.addEventListener("readystatechange", (e) => {
                var scel=PLX.getScrollElm(el[0]).nodeName,
                    scrollOnBody=scel==="BODY";
                "complete" === e.target.readyState && (
                    PLX.hgCalc(el),
                    mobile || window.addEventListener("resize", () => {
                        windowHeight = window.innerHeight,
                        PLX.hgCalc(el)
                    }),
                    scrollOnBody && window.addEventListener("scroll", () => { PLX.paraAnim(el) }),
                    !scrollOnBody && document.querySelector(scel.toLowerCase()).addEventListener("scroll", () => {
                        PLX.paraAnim(el)  
                    })
                )
                
            })
        }, paraAnim : (el) => {
            for (var x = 0; x<el.length; x++) { 
                var i = el[x].parentElement.parentElement.getBoundingClientRect();
                var speed=el[x].parentElement.getAttribute("speed");
                0 <= i.top + i.height && i.top <= windowHeight && 
                    PLX.paraPos(el[x], i, speed)
            }
        },
        paraPos: (elm, e, speed ) =>{
            var c = e.top / speed - windowHeightExtra;
            elm.style.top = c + "px"
        }
    };
    
    PLX.par=Object.assign(PLX.par,prm);
    var el = document.getElementsByClassName(PLX.par.className);
    PLX.init(el);
};
document.addEventListener("DOMContentLoaded", ()=>{
    document.querySelectorAll("[href^='#']").forEach(x=>{
        x.addEventListener('click',e=>{
            try{
                var to=e.target.href.split("#")[1];
                document.getElementById(to).scrollIntoView({behavior: "smooth"});
                e.preventDefault();
            }catch(xc){ }
        });
    });
    mkParallax({ speed: 3 });	
});