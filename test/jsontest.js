
var fs = require("fs");
var obj = JSON.parse(fs.readFileSync("anar_abuse_contents.json"));

var contents=[]
//console.log(obj["content"]);
jsonData=obj
var j =1
for(var i in jsonData){
    var key = i
    var val = jsonData[i]
	contents[j]=val['content']
	contents[j] = contents[j].replace(/#|_|\ـ|-|'|]|\[|\*|\+|\,|\!|\&|\%|\$|\#|\?|\.|\'|\/|\@|\(|\)|\^/g,'');
	contents[j] = contents[j].replace(/#| a | an | and | or /g,' ');
	contents[j] = contents[j].toLowerCase()
	contents[j] = "spam	" + contents[j]
	
	j++
	//console.log(val['content']);
}

console.log(contents)