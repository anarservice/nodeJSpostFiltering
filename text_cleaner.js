function rdigit(number,numdigit)
{
	var output = Math.floor(Math.pow(10,numdigit) * number) / Math.pow(10,numdigit)
	return output
}


function zeros(vector_length)
{
	var output = Array.apply(null, Array(vector_length)).map(Number.prototype.valueOf,0)
	return output
}


function numberword(replaceall,contents)
{
	contents = contents.replace(/0|1|2|3|4|5|6|7|8|9/g,'.');
	for (var i = 0;i<5;i++)
	{
		contents = contents.replace(/\.\.\.\.|\.\.\.|\.\./g,'.')
	}
	contents = contents.replace(/\./g,' numberword ')
	return contents
}


// --- vsm: function for creating costum vector space model
// --- inputs: 
// --- outputs:

function vsm(text,min_unique_length,neutral_popuation_ratio,neutral_difference)
{
	// --- 0.prerequisites ---
	var replaceall = require("replaceall");
	var fs = require('fs');

	var uniquewords = []
	var total_words = 0
	var lables = []
	var total_spam = 0


	// --- 1.Loading file ---
	console.log("loading file")

	var contents = fs.readFileSync(text, 'utf8');
	contents = contents.replace(/#|_|-|'|]|\[|\*|\+|\,|\!|\&|\%|\$|\#|\?|\.|\'|\/|\@|\(|\)|\^/g,'');
	contents = contents.replace(/#| a | an | and | or /g,' ');
	contents = numberword(replaceall,contents)
	contents = contents.toLowerCase()
	var messages = contents.split("\n")
	messages.splice(messages.length - 1)

	console.log("...")
	// =============================
	// --- 2.creating class vector ---
	console.log("creating class vector")

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
			total_spam ++
		}
	}


	console.log(total_spam + " of total " + messages.length + " messages are labled as spam.")
	var spam_percentage = rdigit((100 * total_spam / messages.length) , 2)
	console.log("which is " + spam_percentage + "% of the messages.")

	console.log("...")
	// ====================================
	// --- 3.Creating unique words vector ---
	console.log("creating unique words vector")


	for (m_ind in messages)
	{
		words = messages[m_ind].split(" ")
		total_words += words.length

		for(w_ind in words)
		{
			word = words[w_ind]
			if(uniquewords.indexOf(word) == -1 & word.length > min_unique_length) 
			{
				uniquewords[uniquewords.length] = word
			}
		}
	}

	console.log(uniquewords.length + " uniquewords exist among " + total_words + " number of total words.")
	var unique_percentage = rdigit((100*uniquewords.length / total_words),2)
	console.log("which is " + unique_percentage + "% of the words." )
	console.log("...")


	// ========================
	// --- 4.creating VSM map ---
	console.log("creating VSM map")


	var map = []

	for (m_ind in messages)
	{
		var tempvec = zeros(uniquewords.length)
		for (uni_ind in uniquewords)
		{
			message = messages[m_ind].split(" ")
			uniqueword = uniquewords[uni_ind]

			if (message.indexOf(uniqueword) >= 0 )
			{
				tempvec[uni_ind] = 1
			}
		}
		map[m_ind] = tempvec
	}
	console.log("...")

	// ============================
	// --- 5.Histogram of words ---
	console.log("creating histogram of words")

	var histo = zeros(uniquewords.length)
	var isSpam = zeros(uniquewords.length)
	var isSpamratio = zeros(uniquewords.length)

	for ( uni_ind in uniquewords)
	{
		for (m_ind in messages)
		{
			histo[uni_ind] += map[m_ind][uni_ind]
			if (lables[m_ind] == 1 & map[m_ind][uni_ind] == 1)
			{
				isSpam[uni_ind] ++
			}
		}
		isSpamratio[uni_ind] = rdigit(isSpam[uni_ind] / histo[uni_ind] , 4)
	}
	console.log("...")

	// ============================
	// --- 6.cleaning histogram ---
	console.log("cleaning histogram")
	var max = Math.max(...histo)
	var raw_uniqewords = uniquewords.length
	for (var uni_ind = uniquewords.length; uni_ind >= 0; uni_ind--)
	{
		if (histo[uni_ind] == 1 || (histo[uni_ind]>max*neutral_popuation_ratio & 
			Math.abs(isSpamratio[uni_ind]-(spam_percentage/100))<neutral_difference ))
		{
			uniquewords.splice(uni_ind,1)
			histo.splice(uni_ind,1)
			isSpam.splice(uni_ind,1)
			isSpamratio.splice(uni_ind,1)
			for (m_ind in messages)
			{
				map[m_ind].splice(uni_ind,1)
			}
		}
	}
	var reduction_ratio = (raw_uniqewords - uniquewords.length) / raw_uniqewords
	console.log(rdigit(100*reduction_ratio,2) + '% of unique words have been cleaned out.')
	console.log('new uniquewords length: ' + uniquewords.length)


	console.log("...")

	// ===========================
	// --- 7.generating putput ---
	output = [map,uniquewords,histo,isSpam,isSpamratio,lables]
	return output
}



var fs = require('fs')
var result = vsm('main' , 2 , 0.1 , 0.15)

var map = result[0]
var uniquewords = result[1]
var histo = result[2]
var isSpam = result[3]
var isSpamratio = result[4]
var lables = result[5]

var new_line = ''
for (m_ind in map)
{
	new_line += lables[m_ind] + '\t'

	for (uni_ind in uniquewords)
	{
		if (map[m_ind][uni_ind] == 1)
		{
			new_line += uniquewords[uni_ind] + ' '
		}
	}
	new_line += '\n'
}

new_line.replace(' \n','\n')
fs.writeFile("main_modified", new_line);


/*var csvWriter = require('csv-write-stream')
var writer = csvWriter()

// --- writing out ---
writer.pipe(fs.createWriteStream('out2.csv'))
for (uni_ind in uniquewords)
{
	writer.write(
		{word: uniquewords[uni_ind],
		histo: histo[uni_ind],
		isSpam: isSpam[uni_ind],
		isSpamratio: isSpamratio[uni_ind]})
}
writer.end()*/
