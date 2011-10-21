<?php
if(false){
error_reporting(E_ERROR | E_WARNING | E_PARSE | E_NOTICE);
ini_set('error_reporting', E_ALL);
}
session_start();
// autoload
function __autoload($class_name) {
		    include 'php/'.$class_name . '.class.php';
}

// conect DB
try {
	$db = new PDO("mysql:dbname=spotonTasks;host=localhost","spotonTasks","pass");
	$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_WARNING );
	$db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
}catch (PDOException $e) {
    echo 'Connection failed: ' . $e->getMessage();
}


	$oUser = new User(null,$db);
	

new DataPlotter();

?>
