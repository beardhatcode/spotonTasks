<?
	if(
			isset($_POST['username'],$_POST['password']) &&
			$oUser->login($_POST['username'],$_POST['password'])
		){
		$oUser->getLists();				
		DataPlotter::succeeded();
	}


?>
