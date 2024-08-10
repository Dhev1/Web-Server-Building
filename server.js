const http=require('http');
const path=require('path');
const fs=require('fs');
const fsPromises=require('fs').promises;




const logEvents=require('./logEvents');
const EventEmitter =require('events');
class Emitter extends EventEmitter{};
const myEmitter=new Emitter();

const PORT=process.env.PORT || 3500;
myEmitter.on('log',(msg,fileName)=> logEvents(msg,fileName));
const serverFile=async(filePath,contentType,response)=>{
    try{
        const rawdata=await fsPromises.readFile(filePath,!contentType.includes('image')?'utf8' :'');
        const data=contentType==='application/json'
            ? JSON.parse(rawdata):rawdata;
            response.writeHead(200,{'Content-Type': contentType});
        response.end(
            contentType==='application/json'? JSON.stringify(data):data
        );
    }catch(err){//to throw server error
        console.log(err);
        //to throw error when server occurs while logging
        myEmitter.emit('log',`${err.name}:${err.message}`,'errLog.txt');
        response.statusCode=500;
        response.end();
    }
};


const server=http.createServer((req,res)=>{
    console.log(req.url,req.method);
    //to print logging events in reqLog.txt file
    myEmitter.emit('log',`${req.url}\t${req.method}`,'reqLog.txt');
    //to know the extension of the rquested url and assign the content type
    const extension=path.extname(req.url);
    let contentType;
    switch(extension){
        case '.css':
            contentType='text/css';
            break;
        case '.js':
            contentType='text/javascript';
            break;
        case '.json':
            contentType='application/json';
            break;
        case '.jpg':
            contentType='image/jpeg';
            break;
        case '.png':
            contentType='image/png';
            break;
        case '.txt':
            contentType='text/plain';
            break;
        default:
            contentType='text/html';
    }
    //to retrieve the filepath from user inputed request from localhost 3500
    let filePath=
        contentType==='text/html' && req.url==='/'
            ?path.join(__dirname,'views','index.html')
            :contentType==='text/html' && req.url.slice(-1)==='/'
                ?path.join(__dirname,'views',req.url,'index.html')
                :contentType==='text/html'
                    ?path.join(__dirname,'views',req.url)
                    :path.join(__dirname,req.url);

    if(!extension && req.url.slice(-1)!=='/') filePath+='.html';//if  no extension is mentioned then default html exe wille be to the pathe of the file

    const fileExists=fs.existsSync(filePath);
    if(fileExists){
        //serve file
        serverFile(filePath,contentType,res);
    }
    else{
        //serve 404 or 301 redirect
        switch(path.parse(filePath).base)//parse works by defining the specific path like from which dir,what exe,name of the file etc
        {
            case 'old-page.html'://for redirection if user mistakes in specifying path eeee
                res.writeHead(301,{'Location':'/new-page.html'});
                res.end();
                break;
            case 'www-page.html':
                res.writeHead(301,{'Location':'/'});
                res.end();
                break;
                default:
                    //serve 404 response
                    serverFile(path.join(__dirname,'views','404.html'),'text/html',res);
        }
    
    }
});



server.listen(PORT, ()=> console.log(`server running on port ${PORT}`));
