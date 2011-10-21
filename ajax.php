<?
//var_dump($_GET,$_POST,$_POST[data]);
include('include.php');

switch($_GET['action']){
	case 'login':
		$oUser->login($_POST['username'],$_POST['password']);
	break;	
	case 'list':
		include('php/list.inc.php');
	break;
	default:
		die('{"succes":false}');
}

$oUser->checkLogin();

DataPlotter::AJAX();

?>
