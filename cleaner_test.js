function getlable(messages)
{
	var lables = []
	for (m_ind in messages)
	{
		lable_sms = messages[m_ind].split("\t")
		if (lable_sms[0] == 'ham')
		{
			lables[m_ind] = 'ham'
			messages[m_ind] = messages[m_ind].replace("ham\t","")
		}
		else
		{
			lables[m_ind] = 'spam'
			messages[m_ind] = messages[m_ind].replace("spam\t","")
		}
	}
	return [messages,lables]
}


// --- 0. Prerequisites ---
var bayes = require('bayes')
var fs = require('fs');
var csvWriter = require('csv-write-stream')
var writer = csvWriter()

// --- 1. Loading file ---
var contents = fs.readFileSync('main', 'utf8');
contents = contents.replace(/#|_|-|'|]|\[|\*|\+|\,|\!|\&|\%|\$|\#|\?|\.|\'|\/|\@|\(|\)|\^/g,'');
contents = contents.replace(/#| a | an | and | or /g,' ');
contents = contents.toLowerCase()
var messages = contents.split("\n")
messages.splice(messages.length - 1)


// --- 3. elicit lable vector ---
messages_lables = getlable(messages)
messages = messages_lables[0]
lables = messages_lables[1]

// --- 3.5. text cleaning ---
console.log("preliminary text classification")
var bayes = require('bayes')
var tempfilter = bayes()
for (m_ind in messages)
{
	tempfilter.learn(messages[m_ind],lables[m_ind])
}
console.log(tempfilter.docCount)
console.log("total number of messages: " + tempfilter.totalDocuments)
console.log("total number of unique words: " + tempfilter.vocabularySize)
console.log("... done ...")
//---
console.log("loading uniquewords")
var uniquewords = Object.keys(tempfilter.vocabulary)
console.log("... done ...")
//---
console.log("creating uniquewords histogram")
var spamwords = tempfilter.wordFrequencyCount['spam']
var hamwords = tempfilter.wordFrequencyCount['ham']
var histo = []
var spamity = []
for (uni_ind in uniquewords)
{
	var isSpam = spamwords[uniquewords[uni_ind]]
	var isHam = hamwords[uniquewords[uni_ind]]
	if (isSpam == undefined)
	{
		isSpam = 0
	}
	if (isHam == undefined)
	{
		isHam = 0
	}
	histo[uni_ind] = isSpam + isHam
	spamity[uni_ind] = isSpam / histo[uni_ind]
}
console.log("... done ...")
//---
console.log("cleaning uniquewords")
var before = uniquewords.length
var spam_percentage = tempfilter.docCount.spam / (tempfilter.docCount.spam + tempfilter.docCount.ham)
var max = Math.max(...histo)
var neutral_population_ratio = 0.05
var neutral_difference = 0.01
var junk = []
for (var uni_ind = uniquewords.length,i = 0; uni_ind >= 0; uni_ind--)
{
	var histo_check = histo[uni_ind] == 1
	var neutral_check = (histo[uni_ind]>max*neutral_population_ratio & 
		Math.abs(spamity[uni_ind]-(spam_percentage))<neutral_difference )
	var length_check = uniquewords.length < 2
	if (histo_check == true || neutral_check == true || length_check == true )
	{
		junk[i] = uniquewords[uni_ind]
		i++
		uniquewords.splice(uni_ind,1)
		histo.splice(uni_ind,1)
		spamity.splice(uni_ind,1)
	}
}
var after = uniquewords.length
console.log(Math.floor(100*(before-after)/before) + "% of uniquewords cleaned")
console.log("... done ...")
console.log("rewriting messages")
for (m_ind in messages)
{
	for (j in junk)
	{
		messages[m_ind] = messages[m_ind].replace(' '+junk[j]+' ',' ')
		var a = messages[m_ind].length-1-junk[j].length
		var b = messages[m_ind].length
		if (messages[m_ind].substring(a,b) == ' '+junk[j])
		{
			messages[m_ind] = messages[m_ind].replace(' '+junk[j],'')
		}
		if (messages[m_ind].substring(0,junk[j].length+1) == junk[j]+' ')
		{
			messages[m_ind] = messages[m_ind].replace(junk[j]+' ','')
		}
	}
}
console.log("... done ...")

// --- 4. learning process ---
var classifier = bayes()
for (m_ind in messages)
{
	classifier.learn(messages[m_ind], lables[m_ind])
}




/*writer.pipe(fs.createWriteStream('trn_tst_graph_modified.csv'))
for (i in error_trn)
{
	writer.write({error_trn: error_trn[i], error_tst: error_tst[i]})
}
writer.end()*/