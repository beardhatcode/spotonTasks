<?php
if(!(is_numeric($_GET['listId']) || $_GET['listId'] == "null")){
	DataPlotter::warn('Faild to create/find list!');
	DataPlotter::requestAction('reload');
}
else
{
	if($_GET['listId'] == "null" && !empty($_POST['data'])){
		//create a new list
		$oUser->createList($_POST['data']);
	}else{
		$oTaskList = new TaskList($_GET['listId'],$db,$oUser);
	
		if(isset($_POST['data'])){
			$oTaskList->update($_POST['data']);
		}
		$oTaskList->ArrayList();
	}
}

?>
