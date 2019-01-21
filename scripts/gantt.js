var tasks = [
{"startDate":new Date("Aug 2004"),"endDate":new Date("May 2008"), "taskName":"Anna University\n[BEng]","status":"EDUCATION"},
{"startDate":new Date("Dec 2007"),"endDate":new Date("Apr 2008"), "taskName":"ANURAG\n[Intern]","status":"INTERNSHIP"},
{"startDate":new Date("Aug 2008"),"endDate":new Date("May 2010"), "taskName":"Purdue University\n[Research Assistant]","status":"ASSISTANTSHIP"},
{"startDate":new Date("Aug 2008"),"endDate":new Date("May 2011"), "taskName":"Purdue University\n[MS]","status":"EDUCATION"},
{"startDate":new Date("May 2010"),"endDate":new Date("Aug 2010"), "taskName":"Samsung Research\n[Research Intern]","status":"INTERNSHIP"},
{"startDate":new Date("Aug 2010"),"endDate":new Date("Aug 2011"), "taskName":"Purdue University\n[Research Assistant]","status":"ASSISTANTSHIP"},
{"startDate":new Date("May 2011"),"endDate":new Date("Dec 2014"), "taskName":"Purdue University\n[PhD]","status":"EDUCATION"},
{"startDate":new Date("Aug 2011"),"endDate":new Date("Dec 2011"), "taskName":"Purdue University\n[Teaching Assistant]","status":"ASSISTANTSHIP"},
{"startDate":new Date("Dec 2011"),"endDate":new Date("Feb 2012"), "taskName":"Purdue University\n[Research Assistant]","status":"ASSISTANTSHIP"},
{"startDate":new Date("Feb 2012"),"endDate":new Date("May 2012"), "taskName":"Microsoft Research\n[Research Intern]","status":"INTERNSHIP"},
{"startDate":new Date("May 2012"),"endDate":new Date("Aug 2012"), "taskName":"Purdue University\n[Research Assistant]","status":"ASSISTANTSHIP"},
{"startDate":new Date("Aug 2012"),"endDate":new Date("Dec 2012"), "taskName":"Purdue University\n[Teaching Assistant]","status":"ASSISTANTSHIP"},
{"startDate":new Date("Dec 2012"),"endDate":new Date("Dec 2014"), "taskName":"Purdue University\n[Research Assistant]","status":"ASSISTANTSHIP"},
{"startDate":new Date("Dec 2014"),"endDate":new Date("Sep 2017"), "taskName":"University of Cambridge\n[Research Associate]","status":"JOB"},
{"startDate":new Date("Oct 2017"),"endDate":new Date("Dec 2018"), "taskName":"University of Cambridge\n[Senior Research Associate]","status":"JOB"},
{"startDate":new Date("Oct 2015"),"endDate":new Date("Oct 2018"), "taskName":"1851 Royal Commission\n[Research Fellow]","status":"ASSISTANTSHIP"},
{"startDate":new Date("Oct 2015"),"endDate":new Date("Oct 2018"), "taskName":"Darwin College, Cambridge\n[Research Fellow]","status":"ASSISTANTSHIP"},
{"startDate":new Date("Jan 2019"),"endDate":new Date(), "taskName":"IIT Madras\n[Assistant Professor]","status":"JOB"},
];

var taskStatus = {
	"EDUCATION" : "bar-education",
	"INTERNSHIP" : "bar-internship",
	"ASSISTANTSHIP" : "bar-assistantship",
	"JOB" : "bar-job"
};

var taskNames = [
	"Anna University\n[BEng]",
	"ANURAG\n[Intern]",
	"Purdue University\n[MS]",
	"Purdue University\n[PhD]",
	"Purdue University\n[Research Assistant]",
	"Samsung Research\n[Research Intern]",
	"Purdue University\n[Teaching Assistant]",
	"Microsoft Research\n[Research Intern]",
	"University of Cambridge\n[Research Associate]",
	"University of Cambridge\n[Senior Research Associate]",
  "1851 Royal Commission\n[Research Fellow]",
  "Darwin College, Cambridge\n[Research Fellow]",
  "IIT Madras\n[Assistant Professor]"
];

tasks.sort(function(a, b) {
	return a.endDate - b.endDate;
});
var maxDate = tasks[tasks.length - 1].endDate;
tasks.sort(function(a, b) {
	return a.startDate - b.startDate;
});
var minDate = tasks[0].startDate;

var format = "'%y";

var gantt = d3.gantt().height(550).taskTypes(taskNames).taskStatus(taskStatus).tickFormat(format);
gantt(tasks);
