const Prettyfy=(sel)=>{
     var MKUP={
          esc:(s)=>{
               return s.replace(/[-\/&<> ]/g,
               function(c){
                    return c==' '?'&nbsp;':'&#'+c.charCodeAt(0)+';';
               }
               );
          },
          prettyXml : function(xml,indent){
               var esc=this.esc;
               var se='<font class="xel">',tb='<span class="xtb">',d=0,i,re='',ib,
               sd='<font class="xdt">',tc='<span class="xtc">',ob,at,sz='</font>',
               sa='<font class="xat">',tz='</span>',ind=esc(indent||' '.repeat(3));
               
               xml.match(/(?<=<).*(?=>)|$/s)[0].split(/>\s*</).forEach(function(nd){
               ob=nd.match(/^([!?\/]?)(.*?)([?\/]?)$/s);                         // Split outer brackets
               ib=ob[2].match(/^(.*?)>(.*)<\/(.*)$/s)||['',ob[2],''];            // Split inner brackets 
               at=ib[1].match(/^--.*--$|=|('|").*?\1|[^\t\n\f \/>"'=]+/g)||['']; // Split attributes
               if (ob[1]=='/') d--;                                              // Decrease indent
               re+=tb+tc+ind.repeat(d)+tz+tc+esc('<'+ob[1])+se+esc(at[0])+sz;
               for (i=1;i<at.length;i+=3) re+=esc(' ')+sa+esc(at[i])+sz+"="+sd+esc(at[i+2])+sz;
               re+=ib[2]?esc('>')+sd+esc(ib[2])+sz+esc('</')+se+ib[3]+sz:'';
               re+=esc(ob[3]+'>')+tz+tz;
               if (ob[1]+ob[3]+ib[2]=='') d++;                                   // Increase indent    
               });
               return re;
          },
          prettyJson:(str,indent)=>{
               var obj=JSON.parse(str);
               var json=JSON.stringify(obj, null, 2);
               json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
               return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
               var cls = 'number';
               if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                         cls = 'key';
                    } else {
                         cls = 'string';
                    }
               } else if (/true|false/.test(match)) {
                    cls = 'boolean';
               } else if (/null/.test(match)) {
                    cls = 'null';
               }
               return '<span class="' + cls + '">' + match + '</span>';
               });
          },
          init:(el)=>{
               var str=el.innerHTML;
               try{
                    return MKUP.prettyJson(str);
               }catch(e) { return MKUP.prettyXml(str); }
          }
     };
     document.querySelectorAll(sel).forEach(l=>{ 
          l.innerHTML=MKUP.init(l);
     });
}
