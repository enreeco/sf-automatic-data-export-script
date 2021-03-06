# Automatic Salesforce Data Export Wizard

## Introduction

This simple script extracts zipped CSV files on the [**Salesforce Data Export**](https://help.salesforce.com/articleView?id=admin_exportdata.htm&type=5) feature of the Salesforce Setup.
With this tool you can schedule a script on a local/remote server to automatically download all 512MB zipped files on the Salesforce Data Export page.

## Installation 
1. Install all required modules from package: `npm install`
2. Install Foreman to run with env variables in file `.env`: `npm install -g foreman` or `npm install -g heroku`
3. Rename a `.env-local` file into `.env` and set the local path, Salesforce login Url, username and password+token in the respective keys
4. Run `nf start`or `heroku local`

## Configuration
Before running the script configure the following environment variables:
```
localfolder=path\to\local\folder
loginurl=https://login.salesforce.com
username=myusername@example.
password=PASSWORD+TOKEN
```

## Credits
Enrico Murru 2021 - https://blog.enree.co/2021/01/automatic-export-tool-for-salesforce-data-export-backups.html
