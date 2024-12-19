var usbserial = '/dev/ttyUSB0';
var http = require('http');
var fs = require('fs');
var path = require("path");
var url = require("url");
var SunCalc = require('suncalc');


// Gestion des pages HTML
function sendError(errCode, errString, response) {
  response.writeHead(errCode, {"Content-Type": "text/plain"});
  response.write(errString + "\n");
  response.end();
  return;
}

function sendFile(err, file, response) {
  if(err) return sendError(500, err, response);
  response.writeHead(200);
  response.write(file, "binary");
  response.end();
}

function getFile(exists, response, localpath) {
  if(!exists) return sendError(404, '404 Not Found', response);
  fs.readFile(localpath, "binary",
   function(err, file){ sendFile(err, file, response);});
}

function getFilename(request, response) {
  var urlpath = url.parse(request.url).pathname; 
  var localpath = path.join(process.cwd(), urlpath); 
  fs.exists(localpath, function(result) { getFile(result, response, localpath)});
}

var server = http.createServer(getFilename);

// -- socket.io --
// Chargement
//var io = require('socket.io').listen(server);
const io = require('socket.io')(server);

// -- SerialPort --
// Chargement
var SerialPort = require('serialport');
var Arduino = new SerialPort(usbserial, { autoOpen: false });


// Contrôle des fichiers logs et prog
function Controle_des_fichiers() {
    console.log('-----| Conrôle  des  fichiers  associés |-----');
    console.log('Conrôle des fichiers de logs...');
    try {
        fs.statSync('/etc/Volets/logs_complets.json');
        console.log("   ->'logs_complets.json' existe");
        let logs_journaliers = [JSON.parse(fs.readFileSync('logs_complets.json')), JSON.parse(fs.readFileSync('logs.json'))]; //assemblage de tous les logs précédents cette session
        fs.writeFileSync('logs_complets.json', JSON.stringify(logs_journaliers.join('')));
        console.log("      ->fichier 'logs_complets.json' complété");
        fs.writeFileSync('logs.json', '""'); //création du fichier logs.json avec ""
        console.log("      ->fichier 'logs.json' créé");
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            console.log("   ->'logs_complets.json' n'existe pas");
            fs.writeFileSync('logs_complets.json', '""'); //création du fichier logs_complets.json avec ""
            console.log("      ->fichier 'logs_complets.json' créé");
            fs.writeFileSync('logs.json', '""'); //création du fichier logs.json avec ""
            console.log("      ->fichier 'logs.json' créé");
        }
    }
    console.log('Conrôle des fichiers de programmes...');
    try {
        fs.statSync('/etc/Volets/prog.json');
        console.log("   ->'prog.json' existe");
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            console.log("   ->'prog.json' n'existe pas");
            fs.writeFileSync('prog.json', '{"volets": [],"programmes": []}'); //création du fichier prog.json
            console.log("      ->fichier 'prog.json' créé");
        }
    }
    console.log('>>>>>> Fin  du  contrôle  des  fichiers <<<<<<');
    Logs("", "_--------", Horloge(), '_Fichiers_:_Ok_');
    console.log('');
}


// Ajout/Suppression/Activation/Desactivation de programmes et volets
function Nouveau_Programme(actif, mouvement, pourcentage, volet, heure, minute, ecart, aleatoire_general, aleatoire_individuel) {
    let Programmes = JSON.parse(fs.readFileSync('prog.json'))['programmes']; //lecture du fichier prog2
    let Volets = JSON.parse(fs.readFileSync('prog.json'))['volets']; //lecture du fichier prog2
    let NumNewProg = Programmes.length;
    console.log('NumNewProg =', NumNewProg);
    let NewProg = {
        "actif": actif,
        "mouvement": mouvement,
        "pourcentage": pourcentage,
        "volet": volet,
        "heure": heure,
        "minute": minute,
        "ecart": ecart,
        "aleatoire_general": aleatoire_general,
        "aleatoire_individuel": aleatoire_individuel
    };
    console.log('newprog =', NewProg);
    Programmes[NumNewProg] = NewProg
    const ContenuProg = {};
    Object.defineProperties(ContenuProg, {
        'volets': {
            value: Volets,
            writable: true,
            enumerable: true,
            configurable: true
        },
        'programmes': {
            value: Programmes,
            writable: true,
            enumerable: true,
            configurable: true
        }
    });
    fs.writeFileSync('prog.json', JSON.stringify(ContenuProg));
}
function Suppression_Programme(Numero) {
    let Programmes = JSON.parse(fs.readFileSync('prog.json'))['programmes']; //lecture du fichier prog2
    let Volets = JSON.parse(fs.readFileSync('prog.json'))['volets']; //lecture du fichier prog2
    Programmes.splice(Numero,1)
    const ContenuProg = {};
    Object.defineProperties(ContenuProg, {
        'volets': {
            value: Volets,
            writable: true,
            enumerable: true,
            configurable: true
        },
        'programmes': {
            value: Programmes,
            writable: true,
            enumerable: true,
            configurable: true
        }
    });
    fs.writeFileSync('prog.json', JSON.stringify(ContenuProg));
}
function Nouveau_Volet(volet, nom, temps_monte, temps_descente, etat) {
    let Programmes = JSON.parse(fs.readFileSync('prog.json'))['programmes']; //lecture du fichier prog2
    let Volets = JSON.parse(fs.readFileSync('prog.json'))['volets']; //lecture du fichier prog2
    let NumNewVolet = Volets.length;
    console.log('NumNewVolet =', NumNewVolet);
    let NewVolet = {
        "volet": volet,
        "nom": nom,
        "temps_monte": temps_monte,
        "temps_descente": temps_descente,
        "etat": etat
    };
    console.log('newVolet =', NewVolet);
    Volets[NumNewVolet] = NewVolet
    const ContenuProg = {};
    Object.defineProperties(ContenuProg, {
        'volets': {
            value: Volets,
            writable: true,
            enumerable: true,
            configurable: true
        },
        'programmes': {
            value: Programmes,
            writable: true,
            enumerable: true,
            configurable: true
        }
    });
    fs.writeFileSync('prog.json', JSON.stringify(ContenuProg));
}
function Suppression_Volet(Numero) {
    let Programmes = JSON.parse(fs.readFileSync('prog.json'))['programmes']; //lecture du fichier prog2
    let Volets = JSON.parse(fs.readFileSync('prog.json'))['volets']; //lecture du fichier prog2
    Volets.splice(Numero)
    const ContenuProg = {};
    Object.defineProperties(ContenuProg, {
        'volets': {
            value: Volets,
            writable: true,
            enumerable: true,
            configurable: true
        },
        'programmes': {
            value: Programmes,
            writable: true,
            enumerable: true,
            configurable: true
        }
    });
    fs.writeFileSync('prog.json', JSON.stringify(ContenuProg));
}
function Activation_Programme(Numero) {
    let Programmes = JSON.parse(fs.readFileSync('prog.json'))['programmes']; //lecture du fichier prog2
    let Volets = JSON.parse(fs.readFileSync('prog.json'))['volets']; //lecture du fichier prog2
	//let Programme = Programmes[Numero]
	var Etat
	if (Programmes[Numero].actif == "oui") {
		Etat = ""
	}
	else{
		Etat = "oui"
	}
	Object.defineProperties(Programmes[Numero], {
        'actif': {
            value: Etat,
            writable: true,
            enumerable: true,
            configurable: true
        }
	});
    const ContenuProg = {};
    Object.defineProperties(ContenuProg, {
        'volets': {
            value: Volets,
            writable: true,
            enumerable: true,
            configurable: true
        },
        'programmes': {
            value: Programmes,
            writable: true,
            enumerable: true,
            configurable: true
        }
    });
    fs.writeFileSync('prog.json', JSON.stringify(ContenuProg));
}


// Gestion des logs
function Logs(SeparateurExterne, SeparateurInterne) {
    let LogsAjoutes = Array.prototype.slice.call(arguments, 2).join(SeparateurInterne) //récupération des arguments 3 et plus
    let LogsComplets = [JSON.parse(fs.readFileSync('logs.json')), LogsAjoutes].join(SeparateurExterne);; //Extrait et complète avec les nouveaux logs
    fs.writeFileSync('logs.json', JSON.stringify(LogsComplets)); //Enregistre les logs
    io.sockets.emit('logs', LogsComplets); //Envoie les log à la page web
}


// Construction de l'heure actuelle
function Horloge() {
    let date = new Date();
    let h = date.getHours();
    let m = date.getMinutes();
    let s = date.getSeconds();
    if (h < 10) { h = "0" + h };
    if (m < 10) { m = "0" + m };
    if (s < 10) { s = "0" + s };
    hms = (h + ":" + m + ":" + s);
    hm = (h + ":" + m);
    HeureActuelle = h
    MinuteActuelle = m
    SecondeActuelle = s
    return hms
}


// Génération de nombre entier aléatoire
function Nombre_Aleatoire(Limite_Absolue) {
    return Math.floor(Math.random() * ((Limite_Absolue) - (-Limite_Absolue) + 1)) + (-Limite_Absolue);
}
var timeouts = [];

// Gestion des programmes enregistrés dans prog.json
function Gestion_des_Programmes() { //gestion des programmes enregistrés dans 'prog.json'
    console.log("Recherche des programmes");
    var Programmes = JSON.parse(fs.readFileSync('prog.json'))['programmes']; // Extraction des programmes
    for (var i = 0; i < Programmes.length; i++) { // Boucle pour tous les programmes
        if (Programmes[i].actif == "oui") { // Séléction des programmes actifs
            var Volets = Programmes[i].volet
            var Aleatoire_General = Nombre_Aleatoire(parseInt(Programmes[i].aleatoire_general))
            for (var j = 0; j < Volets.length; j++) { // Boucle pour chaque volet du programme en cours
                var Mouvement = Programmes[i].mouvement;
                var Volet = Volets[j];
                var Pourcentage = parseInt(Programmes[i].pourcentage);
                let Sun = SunCalc.getTimes(new Date(), 48.58466563577164, 7.754201031112804, 140)/*******************************voir pour une automatisation des coordonnée**************************************************/
                let HeureProg = Programmes[i].heure;
                if (HeureProg == "sunrise") { HeureProg = Sun.sunrise.getHours() };
                if (HeureProg == "goldenHourEnd") { HeureProg = Sun.goldenHourEnd.getHours() };
                if (HeureProg == "goldenHour") { HeureProg = Sun.goldenHour.getHours() };
                if (HeureProg == "sunset") { HeureProg = Sun.sunset.getHours() };
                let MinuteProg = Programmes[i].minute;
                if (MinuteProg == "sunrise") { MinuteProg = Sun.sunrise.getMinutes() };
                if (MinuteProg == "goldenHourEnd") { MinuteProg = Sun.goldenHourEnd.getMinutes() };
                if (MinuteProg == "goldenHour") { MinuteProg = Sun.goldenHour.getMinutes() };
                if (MinuteProg == "sunset") { MinuteProg = Sun.sunset.getMinutes() };
                HeureProg = parseInt(HeureProg);
                MinuteProg = parseInt(MinuteProg) + parseInt(Programmes[i].ecart) + Nombre_Aleatoire(parseInt(Programmes[i].aleatoire_individuel)) + Aleatoire_General;
                while (MinuteProg > 59) {
                    MinuteProg = MinuteProg - 60;
                    HeureProg = HeureProg + 1;
                };
                while (MinuteProg < 0) {
                    MinuteProg = MinuteProg + 60;
                    HeureProg = HeureProg - 1;
                };
                console.log('programme n°', i, '-', j, ' = ', Mouvement, Volet, ' à ', HeureProg, 'heure', MinuteProg, 'minutes')
                Logs("","", ' ..................................._prog_n°', i, '-', j, '_=_', Mouvement, Volet, '_à_', HeureProg, 'h_', MinuteProg, '_...................................');
				
				
				timeouts.push( 
                setTimeout(Commande_Programme, Temps_avant_Programme(HeureProg, MinuteProg), Mouvement, Volet, Pourcentage, i, j)
					);
            }
        }
    }
	console.log(Programmes.length+" programmes activés")
    console.log(">>>>>>>>>     Fin   des   programmes     <<<<<<<<<");
    console.log('');
}
function Annulation_des_Programmes(){
	for (var i = 0; i < timeouts.length; i++) {
		clearTimeout(timeouts[i]);
	}
	console.log("Annulation des programmes")
	timeouts = [];
}
function Maj_des_Programmes(heure, minute, interval) {
    console.log("Maj des programmes à " + heure + " heure " + minute + " toutes les " + interval + " heures");
    var I = 0;
    setTimeout(Maj_des_Programmes_recurrent, Temps_avant_Programme(heure, minute), interval, I)
    I++;
    console.log("Maj des programmes réglée");
}
function Maj_des_Programmes_recurrent(intervalle, I) {
    console.log("Maj des programmes")
    Annulation_des_Programmes();
    console.log("Réinitialisation des programmes");
    Gestion_des_Programmes();
    var Interval = intervalle * 1000*60*60;
    if (I == 0) {
        setInterval(Maj_des_Programmes_recurrent, Interval, intervalle)
    };
    console.log("Prochaine Maj des programmes dans " + Interval / 1000 / 60 / 60 + " heures");
}


// Calcul temps restant aux programmes enregistrés dans 'prog.json' avant heure definie par "HeureProg" et "MinuteProg"
function Temps_avant_Programme(HeureProg, MinuteProg) {
    Horloge()
    let SecondesRestantes = 0 - SecondeActuelle
    let MinutesRestantes = MinuteProg - MinuteActuelle
    let HeuresRestantes = HeureProg - HeureActuelle
    if (SecondesRestantes < 0) {
        SecondesRestantes += 60;
        MinutesRestantes -= 1;
    }
    if (MinutesRestantes < 0) {
        MinutesRestantes += 60;
        HeuresRestantes -= 1;
    }
    if (HeuresRestantes < 0) {
        HeuresRestantes += 24;
    }
    console.log('                       Execution dans ', HeuresRestantes, ":", MinutesRestantes, ":", SecondesRestantes)
    return (((MinutesRestantes * 60) + (HeuresRestantes * 60 * 60) + SecondesRestantes) * 1000)
}


// Gestion des commandes des programmes
function Commande_Programme(Mouvement, Volet, Pourcentage, i, j) { //definition des ordres contenus dans les programmes enregistrés dans 'prog.json'

    if (Pourcentage > 100 || isNaN(Pourcentage) || Pourcentage == 0 || Mouvement == "s") {
        Logs("", "", ' prog_n°', i, '-', j, '>>>>', Horloge(), '--', Mouvement, Volet, '_->_');
        console.log(' prog_n°', i, '-', j, '>>>>', Horloge(), '--', Mouvement, Volet, '_complètement')
        Commande(Mouvement + Volet)
    }
    else {
        Logs("", "", ' prog_n°', i, '-', j, '>', Horloge(), '-', Mouvement, Volet, '_à_', Pourcentage, '%_->_');
        console.log(' prog_n°', i, '-', j, '>>>', Horloge(), '--', Mouvement, Volet, '_à_', Pourcentage, '%')
        pourcentage(Mouvement, Volet, Pourcentage);
    }
}


//Gestion des commandes avec pourcentages
function pourcentage(Mouvement, Volet, Pourcentage) {
    var Volets = JSON.parse(fs.readFileSync('prog.json'))['volets']; // Extraction des programmes
    var TempsDescente = parseFloat(Volets[0].temps_descente);
    var TempsMonte = parseFloat(Volets[0].temps_monte);
	
    //var Etat = parseInt(Volets[0].etat);
	
	// 20s 17s 22s
	//           m      /      d
	//  0 = jour + 0%	/  10% - jour == 0
	// 10 = jour + 10%  /  20% - jour
	// 20 = jour + 20%  /  30% - jour
	// 30 = jour + 30%  /  40% - jour
	// 40 = jour + 40%  /  50% - jour
	// 50 = jour + 50%  /  60% - jour
	// 60 = jour + 60%  /  70% - jour
	// 70 = jour + 70%  /  80% - jour
	// 80 = jour + 80%  /  90% - jour
	// 90 = jour + 90%  / 100% - jour
	//100 =      m      /      d
    
	var MiseEnRoute = (Mouvement + Volet);
    var Arret = ('s' + Volet);
    var DecalagePourFonctionnement = 1500

    if (Mouvement == "m") {
        var TempsJour = (1 - 0.9025) * TempsMonte * 1000;
        var TempsPourcentage = 0.9025 * TempsMonte * 1000 * (Pourcentage / 100);
        var TempsMouvement = TempsJour + TempsPourcentage + DecalagePourFonctionnement;
        //tps = (Temps_monte * 1000 * (pourcentage / 100)) + DecalagePourFonctionnement;
    };
    if (Mouvement == "d") {
        var TempsPourcentage = 0.9025 * TempsDescente * 1000 * (Pourcentage / 100);/*0.9025*/
        var TempsMouvement = TempsPourcentage + DecalagePourFonctionnement;
    };
    console.log('MiseEnRoute=', MiseEnRoute, ' Arret=', Arret, ' TempsJour=', TempsJour, ' TempsPourcentage=', TempsPourcentage, ' TempsMouvement=', TempsMouvement)
    setTimeout(Commande, DecalagePourFonctionnement, MiseEnRoute);
    setTimeout(Commande, TempsMouvement, Arret);
}


// Envoie des commandes à l'Arduino
function Commande(Ordre) {
    console.log('Arduino.write(Ordre)=', Ordre)
    Arduino.write(Ordre)
}




/********************* Fin des déclaration de fonctions *********************/




// Overture du port serie et lecture des programmes
Arduino.open(function (err) {
    console.log("----|      Ouverture  des  ports  Arduino      |----");
    if (err) {
        return console.log('Error opening port: ', err.message);
        /*** IMPORTANT ***
        - La communication série dans les sketches arduino doit être paramètrés à 115200 bauds : Serial.begin(115200);
        - Pour fonctionner correctement, le fichier 'index' /etc/Volets/node_modules/@serialport/stream/lib/index.js à été modifié à la ligne 14
          "baudRate: 115200,"
          */
    }
    else {
        console.log(">>>>> Communication avec Arduino fonctionnelle <<<<<");
        console.log("")
        Logs("--------", "", '_Arduino_:_Ok');
    }
    console.log("--------|   Gestion   des   programmes   |--------");
    Gestion_des_Programmes() //placé ici pour suivre un ordre logique
    Maj_des_Programmes(03, 30, 24) //réglage de l'heure à laquelle faire les maj des programmes tous les ... heures (pour garder les horaires aléatoires)
});


// Requetes de la page web                     ************ voir pour reprendre pour l'affichage des programmes et volets
io.sockets.on('connection', function (socket) {
	// Message à la connection
    console.log('Connexion web : Ok');
    Logs("", "", " ",Horloge(),'_................................._Connexion_web_:_Ok_.................................. ');
    socket.emit('message', 'Connexion web : Ok');
    // Le serveur reçoit un message" du navigateur    
    socket.on('message', function (msg) {
        socket.emit('message', 'Veuillez patienter !\n');
        console.log("msg =", msg);
        Logs("","", ' =======>>>>>>>>', Horloge(), '--"', msg, '"_->_');
        Arduino.write(msg, function (err) {
            if (err) {
                io.sockets.emit('message', err.message);
                return console.log('Error: ', err.message);
            }
            else {
                console.log("message envoyé à l'arduino");
            }
		});
    });
	
	socket.on('programmes', function (msg) {
        console.log("prg =", msg);
		let Programmes = JSON.parse(fs.readFileSync('prog.json'))['programmes']; // Extraction des programmes
		socket.emit('programmes', Programmes);
    });
	
	
	socket.on('suppression_de_programme', function (msg) {
        console.log("Suppression du programme n°", msg);
		Suppression_Programme(msg);
		let message = "Programme n°"+msg+" supprimé";
		socket.emit('suppression_de_programme', message);
    });
	
	socket.on('activation_programme', function (msg) {
        console.log("Changement d'état du programme n°", msg);
		Activation_Programme(msg);
		let message = "Etat du programme n°"+msg+" modifié";
		socket.emit('activation_programme', message);
    });
	
	socket.on('nouveau_programme', function (actif, mouvement, pourcentage, volets, heures, minutes, ecart, aleatoire_general, aleatoire_individuel) {
        console.log("Ajout du programme =", actif, mouvement, pourcentage, volets, heures, minutes, ecart, aleatoire_general, aleatoire_individuel);
		Nouveau_Programme(actif, mouvement, pourcentage, volets, heures, minutes, ecart, aleatoire_general, aleatoire_individuel)
		let message = "Programme n°"+(JSON.parse(fs.readFileSync('prog.json'))['programmes'].length-1)+" ajouté";
		socket.emit('nouveau_programme', message);
    });
	
	socket.on('actualisation', function (msg) {
        console.log(msg);
		Annulation_des_Programmes()
		setTimeout(Gestion_des_Programmes,3000)
    });
});

//Nouveau_Programme(actif, mouvement, pourcentage, volet, heure, minute, ecart, aleatoire_general, aleatoire_individuel)

// Transmission des requetes à l'arduino
Arduino.on('data', function (data) {
    let buf = new Buffer(data);
    io.sockets.emit('message', buf.toString('ascii')); //Envoie le dernier log ('message') à la page web
    console.log(buf.toString('ascii'));
    Logs("", "", buf.toString('ascii'), '<<<<<<<<=======');
});




/***************************** Script principal *****************************/




Controle_des_fichiers()
console.log("----| Activation du serveur |----");
server.listen(8080);
console.log(">>>>>    Serveur  activé    <<<<<");
console.log("");
Logs("--------", "", '_Serveur_:_Ok_');
// Ouverture des port en attente
// Fonction de gestion des programmes intégrée dans l'ouverture des ports pour respecter l'ordre
// Ouverture de la connexion web

/* * * * * pour essayer les fonctions de modif de porg et volets * * * * *
Nouveau_Programme('oui', 'm', '', ['15', '14'], '10', '30', '0', '0', '0') // modifier 'prog3.json' dans la fonction Nouveau_Programme
Suppression_Programme(5) // modifier 'prog3.json' et 'prog4.json dans la fonction Suppression_Programme
Nouveau_Volet('03', 'Salle à manger (rue)', 18.86, 18.15, 0) // modifier 'prog5.json' dans la fonction Nouveau_Programme
Suppression_Volet(3) // modifier 'prog5.json' et 'prog6.json dans la fonction Suppression_Programme
* * * * */


//*************Lancement des nouveaux 'Setimeout' et annulation des précédents
//*************enregistrement des pourcentages
//*************modif prog
//*************gestion % internet











/*Supression_du_Fichier('test.txt')

function Supression_du_Fichier(Fichier) {
    if (Fichier == '' || Fichier == undefined) { console.log("programme arrêté car le fichier séléctionné pour suppression n'existe pas"); process.exit()}
    var chemin = '/etc/Volets/'+ Fichier
    fs.unlink(chemin, function (err) {
        if (err) throw err;

        console.log('Fichier "',Fichier,'" supprimé');
    });
}*/


/*function monAdresseIP() {
    var ip = false;
    var xmlhttp = new XMLHttpRequest();
    //if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest() };
    //else { xmlhttp = new ActiveXObject(Microsoft.XMLHTTP) };
    xmlhttp.open(GET, "https://db-ip.com/" , false);
        xmlhttp.send();
    var reponse = JSON.Parse(xmlhttp.responseText);
    //On suppose que l'adresse IP est stockée avec la clé ip. Regardez les exemples fournis par les services pour savoir quelle clé correspond à l'adresse IP
    if (reponse[ip]) {
        ip = reponse[ip]
    }
    return ip;
}*/


/***** quitter le programme
process.exit(
*****/