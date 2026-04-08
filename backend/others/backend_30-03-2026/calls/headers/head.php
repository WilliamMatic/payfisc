<?php 
	
	// CORS headers
	$allowedOrigins = [
	    "https://mpako.net",
	    "https://mpako.vercel.app",
		"https://payfisc-hbcv.vercel.app",
		"https://payfisc.vercel.app"
	];

	// Vérifier si le header Origin existe et est dans la liste autorisée
	if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins)) {
	    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
	    header("Access-Control-Allow-Credentials: true");
	    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
	    header("Access-Control-Allow-Headers: Content-Type, Authorization");
	}

?>