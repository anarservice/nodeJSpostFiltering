var jsonfile = require('jsonfile')
var Spamist = require('./lib/Spamist')
var bayes = require('./lib/bayes')
var mynet = Spamist()
console.log(mynet)
var t = 51.5

var messages = mynet.readtext('joke')

var cleaning_options = {
"need_histo": true,
"need_neutral": true,
"need_length": true,
"neutral_population_ratio": 0.2,
"neutral_difference": 0.05
}

var options = {
"calc_error": {
  "do_calc": true,
  "iteration": 10,
  "train_ratio": 0.8,
  "threshold": t
},
"cleaning" : {
  "do_clean": false,
  "cleaning_options": cleaning_options
}
}


var filter = mynet.train(messages,options)
console.log(mynet)



var result = mynet.classify('یه روز یه مرده خورده به نرده',filter,t)
console.log(result)