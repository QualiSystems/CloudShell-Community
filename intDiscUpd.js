const core = require('@actions/core');
const { Octokit } = require('@octokit/core');
const { graphql } = require('@octokit/graphql');
const https = require('https');
const COMMUNITY_OWNER = 'QualiSystems'
const COMMUNITY = 'CloudShell-Community';


async function run() {
if (!core.getInput('clgI').includes(core.getInput('clgS'))) core.error('FAILED CHALLENGE');
else try {
    const ownerSlashRepo = core.getInput('ownerSlashRepo');
    const discNum = core.getInput('discNum');
    const tkn = core.getInput('tkn');

    const owner = ownerSlashRepo.split('/')[0];
    const repo = ownerSlashRepo.split('/')[1];
    
    core.info(`Owner/Repository: ${ownerSlashRepo}`);
    core.info(`Github Discussion Number: ${discNum}`);
    
    let discId;
    const getDiscId_Query = 
`
query GetDiscussionId($name: String!, $owner: String!, $number: Int!) {
  repository(name: $name, owner: $owner) {
    discussion(number: $number) {
      id
      body
      title
    }
  }
}
`;
    
    let getDiscId_QueryHeaders = 
    {
      owner: COMMUNITY_OWNER,
      name: COMMUNITY,
      number: parseInt(discNum),
      headers: {authorization: `Bearer ${tkn}`,},
    };

    let repoDiscussionId;
    let repoDiscussionBody;
    let repoDiscussionUrl;
    let repoDiscussionTitle;

    await graphql(getDiscId_Query,getDiscId_QueryHeaders)
    .then(res=>{
      core.info(JSON.stringify(res));
      try{
        core.notice(res.repository.discussion.id); 
        repoDiscussionId = res.repository.discussion.id;
        repoDiscussionBody = res.repository.discussion.body;
        repoDiscussionTitle = res.repository.discussion.title;
      }catch(e){core.error('GETDISCUSSIONID FAILED.');}
    })
    .catch(errors=>{
      core.notice(errors);        
      core.error(errors);
      core.setFailed('GETDISCUSSIONID ERROR.');
    });
  
        core.info('REPOSITORY\nDISCUSSION ID: '+repoDiscussionId+', DISUCSSION NUMBER: '+discNum);
      let readmeFilePath;
      const octokit = new Octokit({  auth: tkn });
        core.notice('TRYING TO FETCH FILE INDEX FROM REPO...');
        await octokit.request('GET /repos/{owner}/{repo}/contents', {
          owner: owner,
          repo: repo
        }).then(res=>{
          core.info(JSON.stringify(res));
          core.info('----------------------');
          try{
            readmeFilePath = res.data.find(file=>file.name.toLowerCase()=='readme.md').path;
          }catch(e){
            core.warning('ERROR FETCHING README!\n'+JSON.stringify(res.data));
          }
          
        }).catch(error=>{core.info(error);});
        
        let readmeFile;
        let readmeFileContent;
        if (readmeFilePath){
          await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
              owner: owner,
              repo: repo,
              path: readmeFilePath//'README.md'
            }).then(res=>{
             try{ readmeFile = res.data; } catch(_){console.dir(`${_}\nNO README.md for ${owner_repo}`)}
              core.info('----------------------');
              readmeFileContent = Buffer.from(res.data.content, 'base64'); // Ta-da
            }).catch(error=>{core.info(error);});
            
            if (readmeFileContent){
              core.info(readmeFileContent);
              core.info('typeof: '+typeof readmeFileContent);
              core.info('README.md File GET CONTENT, OK');
            }
            else{
              core.warning('README.md File, GET CONTENT, ERROR...\n\n');
            }
          }else {
            core.warning('ERROR FETCHING README!\n'+JSON.stringify(res.data));
          }
    
    let unrendered_readmeFileContent;
let rendered_readmeFileContent;
	  
await octokit.request('POST /markdown', {
  text: String(readmeFileContent),
  headers: {
    'X-GitHub-Api-Version': '2022-11-28'
  }
    }).then(res=>{
      core.info(JSON.stringify(res));
      try{rendered_readmeFileContent = res.data;}
    catch(e_){core.warning(e_); rendered_readmeFileContent = res; core.notice('rendered_readmeFileContent = res'); core.info(rendered_readmeFileContent);}
    }).catch(error=>{core.error(error);});
try{
  core.info(`type of readmeFileContent: ${typeof readmeFileContent}`,true);
  unrendered_readmeFileContent=`<!--_-->
  


${String(readmeFileContent)}

`;
}
catch(e){core.warning(`${JSON.stringify(e)}\nERROR - README.md...`);}
                    
//#endregion README.md request


    
    let updated_repoDiscussionBody='';
   
    let totalDownloadCount_AllReleases=0;
    let latest_release;
    let assets;

    let latestRelease_published_at;
    await octokit.request('GET /repos/{owner}/{repo}/releases', {
      owner: owner,
      repo: repo
    }).then(res=>{
     
      if (res.data[0]){
        latest_release = res.data[0];
        core.info(JSON.stringify(res.data[0]));
      }
  
     try{
      let cdf=String(latest_release.published_at);
      core.info(cdf);
      let cdf_temp=cdf.split('T')[0].split('-')[1]+'/'+cdf.split('T')[0].split('-')[2]+'/'+cdf.split('T')[0].split('-')[0]+' ';
      let cdf_temp2=parseInt(cdf.split('T')[1].split(':')[0])>=12?parseInt(cdf.split('T')[1].split(':')[0])-12:cdf.split('T')[1].split(':')[0];
      if (cdf_temp2<10)cdf_temp+='0';
      cdf_temp+=cdf_temp2+':'+cdf.split('T')[1].split(':')[1]+' ';
      cdf_temp+=parseInt(cdf.split('T')[1].split(':')[0])>12?'PM':'AM';
      cdf=cdf_temp;
      latestRelease_published_at=cdf;

      Object.keys(res.data).forEach(key=>{
        if (res.data[key].assets && res.data[key].assets.length>0){
          Object.values(res.data[key].assets).forEach(asset=>{
            totalDownloadCount_AllReleases+=asset.download_count;
          });
        }
        else{
          core.warning('NO ASSETS!');
        }
      });
      
      assets=res.data[0].assets;     
      core.info(JSON.stringify(assets));    
     }catch(e){}
    }).catch(e=>{core.info(e);core.warning('FETCH LATEST RELEASE METADATA, FAILURE');});
         
    let assets_str='';
    try{ 
      if (assets && Object.keys(assets).length>0){

        assets.forEach(asset=>{
          let sizeFormatted = 
              asset.size<1024?String(asset.size)+'b':asset.size/1024<1024?String(asset.size/1024)+'KB':String(asset.size/1024/1024)+'MB';
          try{
            let scaleSuffix='';
            if (sizeFormatted.includes('KB')){
              sizeFormatted=sizeFormatted.split('.')[0];
              scaleSuffix='KB';
            }
            else if (sizeFormatted.includes('MB')){
              sizeFormatted=sizeFormatted.split('.')[0]+'.'+sizeFormatted.split('.')[1].substring(0,2);
              scaleSuffix='MB';
            } else scaleSuffix='b';
            if (sizeFormatted.replace('.','').length>=7) sizeFormatted=sizeFormatted[0]+','+sizeFormatted.substring(1,4)+','+sizeFormatted.substring(4,sizeFormatted.length);
            sizeFormatted+=' '+scaleSuffix;
assets_str+=`<a href="${asset.browser_download_url}">${asset.name}<sup><br>[${sizeFormatted}]</sup></a><br></a><br>`
          }catch(e){}
        });
       }
    }catch(e){core.warning('ASSETS ERROR')}
          
    //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  
    //BODY    //BODY   //BODY    //BODY   //BODY   //BODY    //BODY   //BODY   //BODY    //BODY   //BODY   //BODY    //BODY   //BODY    //BODY   //BODY   //BODY  //BODY    //BODY   //BODY  
//BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  
//#region //BODY
try{
  if(!repoDiscussionBody.includes(`<h1>${repoDiscussionTitle}</h1>`) && !updated_repoDiscussionBody.includes(`<h1>${repoDiscussionTitle}</h1>`))
        updated_repoDiscussionBody += 
`
<h1>${entry.title}</h1>`;
}catch(er){
  if(!updated_repoDiscussionBody.includes(`<h1>${repoDiscussionTitle}</h1>`))
        updated_repoDiscussionBody += 
`
<h1>${repoDiscussionTitle}</h1>`;
}

      updated_repoDiscussionBody += 
`${repoDiscussionBody.split(`<table width="100%" align="center">`)[0]}`;

if(!updated_repoDiscussionBody.includes('<!--CUTOFF-->'))
  updated_repoDiscussionBody +=
`<!--KEEP--><!--CUTOFF--><!--KEEP-->`
    
repoDiscussionUrl=`https://github.com/${owner}/${repo}`;

updated_repoDiscussionBody += 
`
<br><table width="100%" align="center">`;
try{
  updated_repoDiscussionBody +=
`<th><h3><a href="${repoDiscussionUrl}">Repository</a></h3></th>`;
}catch(er){
  updated_repoDiscussionBody +=
`<th><h3><a href="">Repository</a></h3></th>`;
}

if (
    readmeFile && readmeFileContent && 
    (
      rendered_readmeFileContent.includes('* **') || rendered_readmeFileContent.includes('```') || 
      rendered_readmeFileContent.includes('<li>') || rendered_readmeFileContent.includes('<ul>') || 
      rendered_readmeFileContent.includes('<ol>') || rendered_readmeFileContent.includes('- | -') ||
      rendered_readmeFileContent.includes('-|-') || rendered_readmeFileContent.includes('- | :') ||
      rendered_readmeFileContent.includes('-|:') || rendered_readmeFileContent.includes(': | -') || 
      rendered_readmeFileContent.includes(':|-') || rendered_readmeFileContent.includes(': | :') ||
      rendered_readmeFileContent.includes(':|:') || rendered_readmeFileContent.includes('1)') || rendered_readmeFileContent.includes('1.')
    )
  ){
 
 try{
    if (latest_release && latest_release.html_url) updated_repoDiscussionBody += 
`<th><h3><a href="${latest_release.html_url}">Latest Release</a></h3></th>`;
    else if (latest_release) updated_repoDiscussionBody += `<th><h3>Latest Release</h3></th>`;
 }catch(erro){
  updated_repoDiscussionBody +=
`<th><h3>Latest Release</h3></th>`;
  }
  try{if (readmeFile && readmeFile.html_url) updated_repoDiscussionBody += 
`<td><h3><a href="${readmeFile.html_url}">README.md</a></h3></td>`;
  }
  catch(e){
    if (readmeFile) updated_repoDiscussionBody += 
`<td><h3>README.md</h3></td>`;
  }
}

  else{
  try{
    if (readmeFile && readmeFile.html_url) updated_repoDiscussionBody += 
`<th><h3><a href="${readmeFile.html_url}">README.md</a></h3></th>`;
  }catch(e){
    if (readmeFile) updated_repoDiscussionBody += 
`<th><h3>README.md</h3></th>`;             
  }

  try{
  if (latest_release && latest_release.html_url) updated_repoDiscussionBody += 
`<th><h3><a href="${latest_release.html_url}">Latest Release</a></h3></th>`;
  else if (latest_release) updated_repoDiscussionBody += 
`<th><h3>Latest Release</h3></th>`;
}catch(erro){
  if(latest_release) updated_repoDiscussionBody +=
`<th><h3>Latest Release</h3></th>`;
}
}
      

	  
	  updated_repoDiscussionBody += 
`<tbody>
<tr valign="top"><!--KEEP--><!--CUTOFF--><!--KEEP-->`;
updated_repoDiscussionBody += 	  
`${repoDiscussionBody.split('<!--CUTOFF-->')[2]}<!--CUTOFF--><!--KEEP-->`;
          
          if (latest_release && assets_str) updated_repoDiscussionBody += 
`Total Downloads<sup><br>(All Releases)</sup><br>${totalDownloadCount_AllReleases}<br><br>`;
  
  updated_repoDiscussionBody += `</th>`;        
  
  
  // rendered_readmeFileContent = markdown.render(readmeFileContent);
  let astCount=0;
  let slsCount=0;
  let limit = 5;
  let rfc = unrendered_readmeFileContent;
  if (rfc.includes('-    ')||rfc.includes('   -   '))
   while (slsCount<3&&limit>0){
    try{limit--;slsCount++;
      /******rfc=rfc.replace('-    ','');*******/
    }catch(e){/*******rfc=rfc.replace('   -   ','');*******/}
  }
  astCount=0;
  slsCount=0;
  limit = 5;
  rfc = unrendered_readmeFileContent;
  if (rfc.includes('* *')||rfc.includes('* '))
   while (astCount<5&&limit>0){
    try{limit--;astCount++;
      /*******rfc=rfc.replace('* *','');*******/
    }catch(e){/*******rfc=rfc.replace('* ','');*******/
            }
  }

  try{core.info(`slsCount: ${slsCount}`)}catch{}
  try{core.info(`astCount: ${astCount}`)}catch{}
  
  if(slsCount==0||astCount==0)
  {
    astCount=0;
    let rex = /\*/g;
    let matcz;
    while ((matcz=rex.exec(unrendered_readmeFileContent))!==null) {
      astCount++;
      if (astCount>5) break;
  }  
  slsCount=0;
  rex = /-\s{2,}./g;
  matcz=null;
  while ((matcz=rex.exec(unrendered_readmeFileContent))!==null) {
      slsCount++;
    core.info('SLSCOUNT');
    if (slsCount>3) break;
  }  
  }

try{core.info(`slsCount: ${slsCount}`)}catch{}
try{core.info(`astCount: ${astCount}`)}catch{}
  

  try{
          
          if (
            readmeFileContent && 
            (
              astCount<5 && slsCount<3 && !rendered_readmeFileContent.includes('<pre>') &&
              !rendered_readmeFileContent.includes('* **') && !rendered_readmeFileContent.includes('```') && 
              !rendered_readmeFileContent.includes('<li>') && !rendered_readmeFileContent.includes('<ul>') &&
              !rendered_readmeFileContent.includes('<ol>') && !rendered_readmeFileContent.includes('- | -') &&
              !rendered_readmeFileContent.includes('-|-') && !rendered_readmeFileContent.includes('- | :') &&
              !rendered_readmeFileContent.includes('-|:') && !rendered_readmeFileContent.includes(': | -') && 
              !rendered_readmeFileContent.includes(':|-') && !rendered_readmeFileContent.includes(': | :') &&
              !rendered_readmeFileContent.includes(':|:') && !rendered_readmeFileContent.includes('1)') && !rendered_readmeFileContent.includes('1.')
            )  
          ) 
              updated_repoDiscussionBody += `
<!--README.md-->
<th valign="top">

${rendered_readmeFileContent}

</th>
<!--README.md-->`;

  
  }catch(e){core.info('readmeFileContent ERROR!!!')} 

      let tarLink, tarLinkStr;
      try{tarLink = latest_release.tarball_url;}catch(e){core.info('NO TAR LINK');}
      try{if (tarLink) tarLinkStr = latest_release.tarball_url.split('tarball/')[1]+' (TAR)'}catch(e){}
      let zipLink, zipLinkStr;
      try{zipLink = latest_release.zipball_url;}catch(e){core.info('NO ZIP LINK');}
      try{if (zipLink) zipLinkStr = latest_release.zipball_url.split('zipball/')[1]+' (ZIP)'}catch(e){}  
      
 
      if (latest_release) updated_repoDiscussionBody +=
`<th valign="top" width="20%">
<br>
Link<br><a href="${latest_release.html_url}">${latest_release.tag_name}</a><sup><br>(Version / Tag)</sup><hr/>`;

          if (latest_release && (tarLink || zipLink))
            updated_repoDiscussionBody +=
`TAR / ZIP<br>${tarLink?'<a href=\"'+tarLink+'\">'+tarLinkStr+'</a><br>':''}${zipLink?'<a href=\"'+zipLink+'\">'+zipLinkStr+'</a>':''}<hr/>`;


  try{
    if (latest_release){ 
      let reg = /0([0-9]{2,3})(?=:)/;
      let matReg = latestRelease_published_at.match(reg);
      if (matReg!=null)
       latestRelease_published_at = latestRelease_published_at.replace(matReg[0],matReg[1]);
    }
  }catch(errorrore){}

  if (latest_release){ 
            updated_repoDiscussionBody +=
`Author<br><a target="_blank" href="${latest_release.author.html_url}">${latest_release.author.login}</a><hr/>
Published On<br>${latestRelease_published_at}<hr/>`;
            
   if (assets_str)         updated_repoDiscussionBody +=
`Assets<br>
${assets_str}
<br>
</th>`;
          }

  try{
    if (
      readmeFileContent && 
      (
        astCount>=5 || slsCount>=3 || rendered_readmeFileContent.includes('<pre>') ||
        rendered_readmeFileContent.includes('* **') || rendered_readmeFileContent.includes('```') || 
        rendered_readmeFileContent.includes('<li>') || rendered_readmeFileContent.includes('<ul>') || 
        rendered_readmeFileContent.includes('<ol>') || rendered_readmeFileContent.includes('- | -') ||
        rendered_readmeFileContent.includes('-|-') || rendered_readmeFileContent.includes('- | :') ||
        rendered_readmeFileContent.includes('-|:') || rendered_readmeFileContent.includes(': | -') || 
        rendered_readmeFileContent.includes(':|-') || rendered_readmeFileContent.includes(': | :') ||
        rendered_readmeFileContent.includes(':|:') || rendered_readmeFileContent.includes('1)') || rendered_readmeFileContent.includes('1.')
      )
    )
      updated_repoDiscussionBody += 
`<!--README.md-->
<td valign="top">

${rendered_readmeFileContent}

</td>
<!--README.md-->`;

  
  }catch(e){core.info('readmeFileContent ERROR!!!')} 

          updated_repoDiscussionBody +=
  `</tr>
  </tbody>`;
        
          if (readmeFileContent && latest_release) {
            
              if (
                readmeFileContent && 
                (
                  astCount<5 && slsCount<3 && !rendered_readmeFileContent.includes('<pre>') &&
                  !rendered_readmeFileContent.includes('* **') && !rendered_readmeFileContent.includes('```') &&
                  !rendered_readmeFileContent.includes('<li>') && !rendered_readmeFileContent.includes('<ul>') &&
                  !rendered_readmeFileContent.includes('<ol>') && !rendered_readmeFileContent.includes('- | -') &&
                  !rendered_readmeFileContent.includes('-|-') && !rendered_readmeFileContent.includes('- | :') &&
                  !rendered_readmeFileContent.includes('-|:') && !rendered_readmeFileContent.includes(': | -') && 
                  !rendered_readmeFileContent.includes(':|-') && !rendered_readmeFileContent.includes(': | :') &&
                  !rendered_readmeFileContent.includes(':<') && !rendered_readmeFileContent.includes('1)') && !rendered_readmeFileContent.includes('1.')
                )
              ) {
              updated_repoDiscussionBody +=       
  `<tfoot>
  <th align="right">
  <sub><sup>* Updated Daily</sup></sub>
  </th>
  <th><sub><sup>* Repository, release and asset info is updated daily.<br>Please allow 30-60 seconds for manual update changes to take effect.</sub></sup></th>
  <th align="left">
  <sub><sup><a href="https://hooks.zapier.com/hooks/catch/13116203/b7e29bg?OR=${owner}/${repo}&DN=${discNum}">* Update Now</a></sup></sub>
  </th>
  </tfoot>
  </table>`;
            }else{  
              updated_repoDiscussionBody +=       
`<tfoot>
  <th align="right">
  <sub><sup>* Updated Daily</sup></sub>
  </th>
  <th align="right">
  <sub><sup><a href="https://hooks.zapier.com/hooks/catch/13116203/b7e29bg?OR=${owner}/${repo}&DN=${discNum}">* Update Now</a></sup></sub>
  </th>
  <td><strong><sub><sup>* Repository, release and asset info is updated daily.<br>* Please allow 30-60 seconds for manual update changes to take effect.</sub></sup></strong></td>
  </tfoot>
  </table>`;
            }
  
          }else updated_repoDiscussionBody += 
  `</table>
  <table width="100%" align="center">
  <td align="right">
  <sub><sup>* Updated Daily</sup></sub>
  </td>
  <th><sub><sup>* Repository, release and asset info is updated daily.<br>For manual update: Please allow 30-60 seconds for changes to take effect.</sub></sup></th>
  <td align="left">
  <sub><sup><a href="https://hooks.zapier.com/hooks/catch/13116203/b7e29bg?OR=${owner}/${repo}&DN=${discNum}">* Update Now</a></sup></sub>
  </td>
  </table>`;

	  //#endregion //BODY

	let regexp;
	let match;
	let matches=[];                 
		   regexp=/\[\s*?(!\s*?\[.*?\])\s*?(\(.*?\))\].*\s*?(?:(?=.*?)|(?=(\n|\s|\v)))/g;
		   if(updated_repoDiscussionBody.match(regexp))
			{
			  regexp = /(?=.*?)\[(.*?)\]\s?\((.*?)\)\]?\(?.*?\)?/g;
			  if(updated_repoDiscussionBody.match(regexp)){
				while ( (match = regexp.exec(updated_repoDiscussionBody) ) !== null ){
				  try{
					updated_repoDiscussionBody = updated_repoDiscussionBody.replace(match[0],`
	<a href="${match[2]}">${match[1]}</a>
	`);
				  }catch(_){core.info(`${_}\n${'(?=.*?)\[.*?\]\s?\(.*?\)\]?\(?.*?\)?'}\nREPLACE regexp ERROR...`)}
				}
			  }
			}
		  
		try{
		regexp = /(?<=\n|\v)( |\t|\s)+(?=\d\.?\)?|\.|i.?\.|i.?\)|v.?\.|v.?\)|x.?\.|x.?\)|#|\*|!|\|-|\| -|\|\<|\|\s\<){1}/g;
	  if (updated_repoDiscussionBody.match(regexp)){
		let reM;
		while ( ( reM = regexp.exec(updated_repoDiscussionBody) ) !== null ){
		  if (reM[0].trim()=='')
			updated_repoDiscussionBody=updated_repoDiscussionBody.replace(reM[0],''); 

	  
		}
	  }
	}catch(e_){core.info(`${e_}\n\n/(?<=\n|\v)( |\t|\s)+(?=\d\.?\)?|\.|i.?\.|i.?\)|v.?\.|v.?\)|x.?\.|x.?\)|#|\*|!|\|-|\| -|\|\<|\|\s\<){1}/g\n\n`);}
		
		 regexp=/(!)?\t*?(\[.*?\])\s*?(\(.*?\))(?:\s?\(.*?\))?/g;
		match=undefined;  matches=[];
	   while ((match = regexp.exec(updated_repoDiscussionBody)) !== null){
		try{
      let tmp_str = '';
      try{
        if (match[1])tmp_str+=match[1];
        if (match[2])tmp_str+=match[2];
        if (match[3])tmp_str+=match[3];

        updated_repoDiscussionBody=updated_repoDiscussionBody.replace(match[0],`${tmp_str}`);

      }catch(e){
			core.info(`${e}\n\n^e ERROR tmp_str`);
		  try{
        if (match[3])
        updated_repoDiscussionBody=
          updated_repoDiscussionBody.replace(`${match[0]}`,`${match[1]}${match[2]}${match[3]}`);
        else if (match[2])
        updated_repoDiscussionBody=
		  	  updated_repoDiscussionBody.replace(`${match[0]}`,`${match[1]}${match[2]}`);
			  else if (match[1])
			  updated_repoDiscussionBody=
			    updated_repoDiscussionBody.replace(`${match[0]}`,`${match[1]}`);
			  
			
        }catch(er){
        core.info(`${er}\n\n^ ERROR tmp_str`);
        core.info(`${er}\n\n^ ERROR tmp_str`);

		  }
		}

		 }catch(error){
		  core.info(`${error}\n\n^error ERROR tmp_str`);

		 }
		}
	 
		try {
		  match=undefined;
		  regexp=/\[.*?\]\(#.*?\)/g;
		  if(readmeFile && readmeFile.html_url )
		  while ((match=regexp.exec(updated_repoDiscussionBody))!==null)
			updated_repoDiscussionBody=
			  updated_repoDiscussionBody.replace(
				match[0]
				,
				`${match[0].split('#')[0]}
				  ${readmeFile.html_url}
				  #${match[0].split('#')[1]}`
		  );
		  
	  }catch(e){core.info(`${JSON.stringify(e)}\n^ updated_repoDiscussionBody ERRORED WHILE REPLACING\nREGEX /\[.*?\]\(#.*?\)/g: [...](#...)`);}



	  try{
		if(updated_repoDiscussionBody.includes('<img src="Pics/')){
		  try{
			updated_repoDiscussionBody = updated_repoDiscussionBody.replaceAll('<img src="Pics/',`<img src="${owner}/${repo}/Pics/`);
		  
		}catch(ex){core.info(`${JSON.stringify(ex)}\nUNABLE TO REPLACE <img src="Pics/ TO <img src={owner}/{repo}/Pics`);}
	  }
	  }catch(e_){core.info(`${e_}\nimg src ERROR!`);}
	  
	  try{
		if(updated_repoDiscussionBody.includes('](Pics/')){
		  try{
			updated_repoDiscussionBody = updated_repoDiscussionBody.replaceAll('](Pics/',`](/Pics/`);
		  
		}catch(ex){core.info(`${ex}\nUNABLE TO REPLACE ](Pics/, ](/{owner}/{repo}/Pics/`);}
	  }
	  }catch(e_){core.info(`${e_}\n/Pics ERROR!`);}



	try{
		   regexp=/!?\s?\[.*?\]\((.*?)\)/g;
		   match=undefined;  matches=[];
		   let tmatch;
		  while ((match = regexp.exec(updated_repoDiscussionBody)) !== null){

			try{core.info(match[0]);}catch(_){core.info(`${_}\n       regexp=/!?\s?\[.*?\]\((.*?)\)/g;        `)}
			core.info(`       regexp=/!?\s?\[.*?\]\((.*?)\)/g;        `);
		   
			if(match[0].includes('![](Images/')){
				try{
				match[2] = match[0].replaceAll('![](Images/',`![](/${owner}/${repo}/raw/master/Images/`);
				matches.push(match);
				continue;
			  }catch(ex){core.info(`${JSON.stringify(ex)}\nUNABLE TO REPLACE ![](Images/___) TO ![](/{owner}/{repo}/raw/master/Images/{match[1]}`);}
			}
			  else if(match[0].includes('![](pics/')){
				try{
				  match[2] = match[0].replaceAll('![](pics/',`![](/pics/${match[1]}`);
				  matches.push(match);
				  continue;
				}catch(exe){core.info(`${JSON.stringify(exe)}\nUNABLE TO REPLACE ![]([pics]/___) TO ![](/{owner}/{repo}/Pics/{match[1]}`);}
			}
			  else if(match[0].includes('![](Pics/')){
				try{
          match[2] = match[0].replaceAll('![](Pics/',`![](/Pics/${match[1]}`);
				  matches.push(match);
				  continue;
				}catch(exe){core.info(`${JSON.stringify(exe)}\nUNABLE TO REPLACE ![]([Pics]/___) TO ![](/{owner}/{repo}/Pics/{match[1]}`);}
			}
			  else if(match[0].includes('](Images/')){
          try{
            match[2] = match[0].replaceAll('](Images/',`](/${owner}/${repo}/raw/master/Images/`);
            matches.push(match);
            continue;
          }catch(exe){core.info(`${JSON.stringify(exe)}\nUNABLE TO REPLACE ![.*](Images/___) TO ![](/{owner}/{repo}/raw/master/Images/{match[1]}`);}
			  }
			  else if(match[0].includes('](pics/')){
				  try{
            match[2] = match[0].replaceAll('](pics/',`](/pics/`);
            matches.push(match);
            continue;
				  }catch(exe){core.info(`${JSON.stringify(exe)}\nUNABLE TO REPLACE ![.*](pics/___) TO ![](/{owner}/{repo}/pics/{match[1]}`);}
			  }
			  else if(match[0].includes('](Pics/')){
				  try{
            match[2] = match[0].replaceAll('](Pics/',`](/Pics/`);
            matches.push(match);
            continue;
				  }catch(exe){core.info(`${JSON.stringify(exe)}\nUNABLE TO REPLACE ![.*](Pics/___) TO ![](/{owner}/{repo}/Pics/{match[1]}`);}
			  }


			  else if (((tmatch = match[0].match(/.*\/(.*?\.(svg\??.*?|jpg|jpeg|png|gif|bmp|mp4|mov|webm))\)/))!==null) &&
			  match[1].includes('Images/')){// && match[0].includes(owner) && match[0].includes(repo))
          try{
            match[2] = match[0].replaceAll('](Images/',`](/${owner}/${repo}/raw/master/Images/`);
            matches.push(match);
            continue;
          }catch(ex){core.info(`${JSON.stringify(ex)}\nUNABLE TO REPLACE ](Images/___.*) TO ...](/{owner}/{repo}/raw/master/Images/{match[1]}`)}
			  }
			  else if (((tmatch = match[0].match(/.*\/(.*?\.(svg\??.*?|jpg|jpeg|png|gif|bmp|mp4|mov|webm))\)/))!==null) &&
			  match[1].includes('pics/')){
          try{
            match[2] = match[0].replaceAll('](pics/',`](/pics/`);
            matches.push(match);
            continue;
  				}catch(ex){core.info(`${JSON.stringify(ex)}\nUNABLE TO REPLACE ](pics/___.*) TO ...](/{owner}/{repo}/pics/{match[1]}`)}
			  }
			  else if (((tmatch = match[0].match(/.*\/(.*?\.(svg\??.*?|jpg|jpeg|png|gif|bmp|mp4|mov|webm))\)/))!==null) &&
			  match[1].includes('Pics/')){
          try{
            match[2] = match[0].replaceAll('](Pics/',`](/Pics/`);
            matches.push(match);
            continue;
          }catch(ex){core.info(`${JSON.stringify(ex)}\nUNABLE TO REPLACE ](Pics/___.*) TO ...](/{owner}/{repo}/Pics/{match[1]}`)}
			  }
			  else if (((tmatch = match[0].match(/\]\(.*?\/.*?\..*?\)/))!==null)
			  && !match[1].includes('http') && !match[1].includes('www') 
			  && !match[1].includes('github.com') ){
          try{
            match[2]=match[0].replace('](',`](/${owner}/${repo}/raw/master/`);
            matches.push(match);
            continue;
          }catch(ex){core.info(`${JSON.stringify(ex)}\nUNABLE TO REPLACE ![...](/___.*) TO ![...](/{owner}/{repo}/raw/master/{match[1]}`)}
			  }
			  

	if (((tmatch = match[0].match(/.*\/(.*?\.(svg\??.*?|jpg|jpeg|png|gif|bmp|mp4|mov|webm))\)/))!==null)
	&& match[1].includes('github.com') )
	{
	  if (match[1].includes('/blob/master/')){
		try{match[2]=match[0].replaceAll('/blob/master/','/raw/master/');}catch(_){core.info('CAUGHT ERROR: /blob/master/ => /raw/master/');}
		matches.push(match);
	  }
	 }
	
	  else if(!match[1].includes('http')&&!match[1].includes('www')&&!match[1].includes('github.com')
	  && match[1].match(/.*\/.*/)!==null&&!match[1].includes('.')) //![](someOwner/someRepo) / [](someOwner/someRepo)
	   {
	
		match[2]=`https://github.com/${owner}/${repo}/blob/master/${match[1]}`;
		matches.push(match);
	   }
	  
			}
		}catch(e){core.info(`ERROR:::::::::::::::::::`);core.info(e);}
	  try{
		core.info(matches.map(o=>o[1]+':'+o[2]));     

		}    catch(e){core.info(`ERROR:::::::::::::::::::`);;core.info(e);}
	try{
		  matches.forEach(m=>{
			core.info('CHANGING ');
			core.info(m[0]+'\nTO:\n'+m[2]);
			core.info('CHANGING...');
			updated_repoDiscussionBody = updated_repoDiscussionBody.replace(m[0],`${m[2]}`);});
	  }catch(e){core.info(`ERROR:::::::::::::::::::`);core.info(e);}


	//#endregion mend 



						  //SIG:
						  try{
							if (repoDiscussionBody.includes('<hr><h6')){
								updated_repoDiscussionBody+='<hr><h6'+repoDiscussionBody.split('<hr><h6')[1];
							}
						  }catch(_e_){core.info(_e_);}


	core.info('+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*');
		core.info(repoDiscussionId);
		core.info(discNum);
		try{core.info(latest_release.html_url);}catch(e){}
		try{core.info('README.md: '+readmeFileContent!==undefined);}catch(e){}
		try{core.info('ASSETS: '+Object.keys(assets).length);}catch(e){}
		try{core.info(latestRelease_published_at);}catch(e){}
		core.info('+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*');
		core.info('+*+*+*+*+*+*+*+*:BODY:+*+*+*+*+*+*+*+*+*+*+*+*');
		core.info(updated_repoDiscussionBody);
		core.info('+*+*+*+*+*+*+*+*^BODY^+*+*+*+*+*+*+*+*+*+*+*+*');
		core.info('+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*');
		core.info('+*+*+*+*+*+*+*+*:::MUTATION:::+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*');

    let updateDiscussionMutation =
  `mutation UpdateDiscussion($discussionId: ID!, $body: String, $clientMutationId: String) {
    updateDiscussion(
      input: {discussionId: $discussionId, body: $body, clientMutationId: $clientMutationId}
      ) {
        clientMutationId
      }
    }`;
    let updateDiscussionMutationHeaders = 
    {
      discussionId: repoDiscussionId,
      body: updated_repoDiscussionBody,
      clientMutationId: 'UpdateDiscussion:OK!',
      headers: {authorization: `Bearer ${tkn}`,},
    };
    
    await graphql(updateDiscussionMutation,updateDiscussionMutationHeaders)
                                .then(res=>{
                                  core.info(JSON.stringify(res));
                                  //(res.UpdateDiscussion.clientMutationId=='UpdateDiscussion:OK!') ?
                                  (JSON.stringify(res).includes('UpdateDiscussion:OK!')) ?
                                    core.notice('DISCUSSION UPDATED.') : core.error('UPDATE DISCUSSION FAILED.') ;
                                })
                                .catch(errors=>{
                                  core.warning(errors);        
                                  core.error('ERROR UPDATING DISCUSSIONS.');
                                });  
  
  core.info('+*+*+*+*+*+*+*+*^^^MUTATION^^^+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*');
  core.notice('FIN');
  core.info('+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*');
  core.info('+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*');
    
    
    
    
  } catch (error) {
    core.error('FAILURE');
    core.error(error.message);
    core.setFailed(error.message);
  }
  
}

run();
