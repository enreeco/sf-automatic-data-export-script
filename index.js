'use strict';

const LOCAL_FOLDER = process.env.localfolder;
const LOGIN_URL = process.env.loginurl || 'https://login.salesforce.com';
const SF_USERNAME = process.env.username;
const SF_PASSWORD = process.env.password;

if(!LOCAL_FOLDER){console.error('Missing "localfolder"'); return 1;}
if(!SF_USERNAME){console.error('Missing "username"'); return 1;}
if(!SF_PASSWORD){console.error('Missing "password"'); return 1;}


const https = require('https');
const request = require('request');
const jsforce = require('jsforce');
const { JSDOM } = require('jsdom');
const jquery = require('jquery');
const fs = require('fs');

const EXPORT_DATA_URL = '/ui/setup/export/DataExportPage/d';
const DOWNLOAD_URL = '/servlet/servlet.OrgExport';
let ORG_ID = null;

const conn = new jsforce.Connection({
	loginUrl: LOGIN_URL,
});

const downloadFile = function(url, cookie, index, cb){
	console.log(`${(new Date()).toISOString()} ## Downloading file: ${url} ...`);
	
	//use http() instead of request() (see https://stackoverflow.com/questions/62919127/node-issue-with-request-pipe-and-large-files-error-cannot-create-a-string-lo)
	//request() has a bus regarding large files (Data Export ZIP files weight up to 512 MB)
	let writeStream = fs.createWriteStream(`${LOCAL_FOLDER}\\backup_${ORG_ID}_${index}.zip`);
	https.get(url, 
		{
		  	gzip: true,
		  	headers: {Cookie: cookie} 
		 }
		,function(response) {
        response.pipe(writeStream);
        writeStream.on('finish', function(){
        	console.log(`${(new Date()).toISOString()} ## File downloaded.`);
        	return cb();
        });
        writeStream.on('error', function (err) {
	    	console.error(err);
	  		return 1;
		});
    })
    .on('error', function() {
	    console.error(err);
	  	return 1;
	})
	.end();
};

const finalCallback = function(){
	console.log(`\n\n${(new Date()).toISOString()} ## Data Export completed.`);
	return 0;
}

const createCallback = function(url, sessionCookie, index, cb){
	return function(){
		downloadFile(url, sessionCookie, index, cb);
	}
};

console.log(`${(new Date()).toISOString()} ## Logging into Salesfoce with username ${SF_USERNAME}...`)
conn.login(SF_USERNAME, SF_PASSWORD, (err, userInfo) =>{
  	if (err) { 
		console.error(err); 
		return 1;
	}

  	const exportDataURL = conn.instanceUrl + EXPORT_DATA_URL;
	const sessionCookie = `sid=${conn.accessToken};`;

	ORG_ID = userInfo.organizationId;
	console.log(`${(new Date()).toISOString()} ## Salesforce login success ${ORG_ID}.`);

	console.log(`${(new Date()).toISOString()} ## Inspecting Export Data wizard landing page...`);
  	request({
  		method:'GET',
  		url: exportDataURL, 
  		headers: {Cookie: sessionCookie} 
  	}, (err, res, body) => {
		if (err) { 
			console.error(err); 
			return 1;
		}
		console.log(`${(new Date()).toISOString()} ## Export Data page inspected.`);

	  	const { window } = new JSDOM(body);
	  	const $ = jquery( window );

	  	let callbacks = [finalCallback];

	  	let links = $('a.actionLink');
	  	for(let i = links.length-1; i >= 0; i--){
		  	let href = $(links[i]).attr('href');
		  	if(href.indexOf(DOWNLOAD_URL) < 0) continue;
	  		let params = href.split('?')[1];
	  		let fileUrl = conn.instanceUrl+DOWNLOAD_URL+'?'+params;
	    	callbacks.push(createCallback(fileUrl, sessionCookie, (i+1), callbacks[callbacks.length-1]) );
	  	}

	  	if(callbacks.length < 2){
	  		console.error('No link found: check if export data is available at '+exportDataURL);
	  		return 1;
	  	}

	  	return callbacks[callbacks.length-1]();
	});
  	
});
