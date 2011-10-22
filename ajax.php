<?
//var_dump($_GET,$_POST,$_POST[data]);
include('include.php');

switch($_GET['action']){
	case 'logout':
	case 'login':
		include('php/user.inc.php');
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
