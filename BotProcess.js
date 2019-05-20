var restify = require('restify');
var builder = require('botbuilder');
var util = require('util');
var Orchestrator = require('uipath-orchestrator');

// Levantar restify
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

var connector = new builder.ChatConnector({
    appId: '',
    appPassword: ''
});

// UniversalBot
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

// Dialogos
//Introducir usuario
bot.dialog('/', [
       function (session, results, next) {
        if (!session.userData.user) {
            session.send('Hola');
            builder.Prompts.text(session, 'Por favor introduce tu usuario:');
        }
        else {
            next();
        }
    },
        function (session, results) {
        if (results.response) {
            let msj = results.response;
            session.userData.user = msj;
        }

        //session.send(`Tu usuario es: ${session.userData.user}`);

        session.beginDialog('/preguntarpass');
    },
]);

//Preguntar password
bot.dialog('/preguntarpass', [
    function (session, results,) {
        if (!session.conversationData.password) {
            builder.Prompts.text(session, 'Genial y ahora tu contraseña');
        }
    },
    function (session, results) {
        if (results.response) {
            let msj = results.response;
            session.conversationData.password = msj;
        }
        //Hacer un Get a los procesos existentes
        var orchestratorInstance = new Orchestrator({
            tenancyName:'kferreiro',
            usernameOrEmailAddress: `${session.userData.user}`,
            password: `${session.conversationData.password}`,
            hostname: 'platform.uipath.com',
            port:'443'
           
        });
        console.log('login');
        
        
        orchestratorInstance.switchOrganizationUnitId(1);
        console.log('switchOrganizationUnitId passed');
        
        
        var apiPath = '/odata/Users';
        var apiQuery = {};
        
        orchestratorInstance.v2.odata.getReleases(  apiQuery, function (err, data) {
            if (err) {
                console.error('Error: ' + err);
            }
            console.log('Data: ' + util.inspect(data));
            
            for (i in data.value)
            {
                //Recuperación del nombre y la key de los procesos
                console.log(data.value[i].ProcessKey);
                console.log(data.value[i].Key);
            }
        });
        //session.send(`Tu contraseña es: ${session.conversationData.password}`);

        session.beginDialog('/preguntarProceso');
        },
]);

bot.dialog('/preguntarProceso', [
    function (session) {
        builder.Prompts.text(session, '¿Cual es el proceso?');
    },
    function (session, results) {
        let msj = results.response;
        
        if(msj!=='cripto'){
            session.send(`El proceso "${msj}" no existe`);
            session.beginDialog('/preguntarProceso');
    }           
        if(msj=='cripto'){
            
             var orchestratorInstance = new Orchestrator({
                tenancyName:'kferreiro',
                usernameOrEmailAddress: `${session.userData.user}`,
                password: `${session.conversationData.password}`,
                hostname: 'platform.uipath.com',
                port:'443'

           
            });
           console.log('login');
               

            orchestratorInstance.switchOrganizationUnitId(1);
            console.log('switchOrganizationUnitId passed');


            var apiPath = '/odata/Users';
            var apiQuery = {};

            orchestratorInstance.v2.odata.getReleases(  apiQuery, function (err, data) {
                if (err) {
                    console.error('Error: ' + err);
                }
                console.log('Data: ' + util.inspect(data));
            });

            orchestratorInstance.v2.odata.postStartJobs({
                "startInfo": {
                "ReleaseKey": "3a291195-29d4-443d-853b-c103863242dd",
                "Strategy": "All",
                "RobotIds": [
                
                ],
                "NoOfRobots": 0,
                "JobsCount": 0,
                "Source": "Manual",
                "InputArguments": ""
                }
            }, function (err, data) {
                if (err) {
                    console.error('Error: ' + err);
                }
                
                session.send(`Ejecutando proceso ${msj}`);
            });
            
        }
    }
]);



