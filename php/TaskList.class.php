<?php
class TaskList {

	/*
	 * TODO:
	 *	
	 */

	public $db = null;
	public $iListId=null;
	public $oListData=null;
	public $oTasks=array();
	private $aBuffer = array();

	function __construct($listId,$oDB,$oUser){
		if(!preg_match('/^\d*$/',$listId)){
			DataPlotter::warn('An error occurd while getting list data, please reload and try again!');
			DataPlotter::requestAction('reload');
			//trigger_error('listId must be an integer,\''.htmlentities($listId).'\' given.',E_USER_ERROR);
		}
		$this->db = $oDB;
		$this->iListId = (int)$listId;
		$this->oUser = $oUser;
		$sql = 'SELECT 
				MAX(`user`) AS `user`, 
				MAX(`own`) AS `own`, 
				MAX(`view`) AS `view`, 
				MAX(`edit`) as `edit`
		FROM `privileges` 
		WHERE 
			`list`=:list AND 
			(`user` = :user OR `user` = 0) 
		GROUP BY `list`';

		$qPrivileges = $this->db->prepare($sql);
		$qPrivileges->execute(array("user"=>$this->oUser->user['id'],'list'=>$this->iListId));
		$this->privileges = $qPrivileges->fetch();

		$this->getList();
	}

	private function getList(){
		if(!$this->privileges['view']){
			$this->oUser->requestLogin();
			DataPlotter::warn('You are not privilegeed to view this list!');
			return false;
		}

		$qGetList = $this->db->prepare("SELECT * FROM lists WHERE id = :listId");
		$qGetList->execute(array('listId'=>$this->iListId));
		$this->oListData=$qGetList->fetch(PDO::FETCH_OBJ);
		
		if($this->oListData !== false){
			$qGetTasks = $this->db->prepare("SELECT * 
											 from tasks
											 WHERE list = :listId 
											 ORDER BY id");
			$qGetTasks->execute(array('listId'=>$this->iListId));
			
			while($aRow = $qGetTasks->fetch()){
				$this->oTasks[$aRow['id']] = new Task($aRow,$this);
			}
		}
	}

	public function add($p_iParent){
		if(!$this->privileges['edit']){
			$this->oUser->requestLogin();
			DataPlotter::warn('not Allowed');
			return false;
		}

		if($p_iParent == '0' || !is_numeric($p_iParent)){
			$iParent = null;
			$iParam = PDO::PARAM_NULL;
		}else{
			$iParent = $p_iParent;
			$iParam = PDO::PARAM_INT;
		}
		
		$qAdd = $this->db->prepare("INSERT INTO tasks (`pId`, `list`) VALUES (:parent, :list);");
		$qAdd->bindValue(':parent', $iParent, $iParam);
		$qAdd->bindValue(':list',$this->iListId);
		$qAdd->execute();
		
		$iId = 	$this->db->lastInsertId('id');
		$this->oTasks[$iId] = new Task(array('id'=>$iId,'pId'=>$iParent,'list'=>$this->iListId),$this);

		return $iId;
	}


	public function update($aUpdateData){
		if(!$this->privileges['edit']){
			$this->oUser->requestLogin();
			DataPlotter::warn('not Allowed');
			return false;
		}

		//ksort($aUpdateData);
		$aRenumbered = array();
		$aRemoved = array();
		foreach($aUpdateData as $sKey => $mNewValue){
			list($sType,$iId) = explode("|",$sKey,2);
			
			$iId = (int)$iId;

			if(array_key_exists($iId,$aRenumbered)){
				$iId  =$aRenumbered[$iId];				
			}
			
			if(!in_array($iId,$aRemoved)){
				switch($sType){
					case 'add':
						if(array_key_exists($mNewValue,$aRenumbered)){
							$mNewValue = $aRenumbered[$mNewValue];
						}
						
						$aRenumbered[$iId] = $this->add($mNewValue);
					break;
					case 'del':
						if(isset($this->oTasks[$iId])){
							$aRemoved[] = $this->oTasks[$iId]->del();
						}
					break;
					case 's':
					case 'g':
					case 'n':
						$this->oTasks[$iId]->change($sType,$mNewValue);
					break;
					default:
						// handle error ?
				}
			}
		}
//	var_dump($aRenumbered);	
	$this->pushBuffer();
	}

	public function bufferUpdate($p_sType,$p_iId,$p_mNewValue){
		$this->aBuffer[$p_sType][$p_iId] = $p_mNewValue;
	}

	public function pushBuffer(){
		if(!$this->privileges['edit']){
			$this->oUser->requestLogin();
			DataPlotter::warn('not Allowed');
			return false;
		}
		$sql = array(
			'n' => "UPDATE `tasks` SET  `name` =  :val WHERE `id` =:id;",
			'g' => "UPDATE `tasks` SET  `completed` =  :val WHERE `id` =:id;",	
			's' => "UPDATE `tasks` SET  `size` =  :val WHERE `id` =:id;"	
		);

		foreach($this->aBuffer as $sType => $aValue){
			$q = $this->db->prepare($sql[$sType]);
		
			foreach($aValue as $iId => $mNewValue){
				$q->execute(array('id'=>$iId,'val'=>$mNewValue));				
			}
				
		}
					
	}

	public function ArrayList(){
		if(!$this->privileges['view']){
			return false;
		}
		
		$aTmpList = array();
		$aListPart = $this->getChildsOf(0);
		$curGain = 0;
		foreach($aListPart as $iListItem => $oChildTask){
			$aTmpList[] = array(
													"n"=>$oChildTask->sName,
													"g"=>$oChildTask->fCompleted,
													"s"=>$oChildTask->fSize,
													"id"=>$oChildTask->iId,
													"c"=>$oChildTask->ArrayList(),
													"p"=>0
													);
			$curGain += ($oChildTask->fSize * $oChildTask->fCompleted );
		}


		$aTaskList=array(
										"n"=>$this->oListData->name,
										'listId'=>$this->oListData->id,
										'id'=>0,
										'g'=>$curGain/100,
										's'=>100,
										"c"=>$aTmpList
								);
		DataPlotter::succeeded();
		DataPlotter::data('list',$aTaskList);
	}

	public function getChildsOf($p_iParent){
			$checker = create_function('$a','return ($a->iPId == '.(int)$p_iParent.');');
			return array_filter($this->oTasks,$checker);
	}

}
?>
