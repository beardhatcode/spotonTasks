<?php
class Task {
	public $iId=null;
	public $sName=null;
	public $fCompleted=null;
	public $fSize=null;
	public $iPId;
	public $TaskList;

	function __construct($p_aData,$p_oParent){
		$this->iId  =(int) $p_aData['id'];
		//if not given leave at null
		@$this->sName  =$p_aData['name'];
		@$this->fCompleted  =(double)$p_aData['completed'];
		@$this->fSize  =(double)$p_aData['size'];
		$this->iPId  =(int)$p_aData['pId'];
		$this->TaskList = $p_oParent;
	}

	public function resize($p_iNewSize){
		if($this->iId == null){
			//Cann't resize main task
			return;				
		}

		$aBroTasks = $this->TaskList->getChildsOf($this->iPId);

		$this->fSize = (double)$p_iNewSize;

		$fOtherTot = 0;
		foreach($aBroTasks as $oBroTask){
			if($oBroTask->iId != $this->iId){
				$fOtherTot += $oBroTask->fSize;
			}
		}

		$fCurTot = $fOtherTot + (double)$p_iNewSize;
		$fChange = (100 - $fCurTot);

		$fParentCompleted = 0;

		foreach($aBroTasks as $oBroTask){
			if($oBroTask->iId != $this->iId){
				if($fOtherTot != 0){
					$oBroTask->fSize += ($oBroTask->fSize / $fOtherTot) * $fChange;
				}else{
					$oBroTask->fSize +=  $fChange;
				}
			}
			
			$fParentCompleted += $oBroTask->fSize * $oBroTask->fCompleted;
			
			$this->TaskList->bufferUpdate('s',$oBroTask->iId,$oBroTask->fSize);
		}

		$fParentCompleted = $fParentCompleted /100;

		if(isset($this->TaskList->oTasks[$this->iPId])){
			$this->TaskList->oTasks[$this->iPId]->relevel($fParentCompleted);
		}
	}

	public function relevel($p_iNewCompleted){
		$this->fCompleted = (double)$p_iNewCompleted;
		$this->TaskList->bufferUpdate('g',$this->iId,$this->fCompleted);
		
		//echo "| $this->iId ==  $p_iNewCompleted |";

		if(isset($this->TaskList->oTasks[$this->iPId])){
			// if Task has a parrent, update it
			$aBroTasks = $this->TaskList->getChildsOf($this->iPId);
		
			$fParentCompleted = 0;
			foreach($aBroTasks as $oBroTask){
				$fParentCompleted += $oBroTask->fSize * $oBroTask->fCompleted;
			}
			
			//var_dump($this->iId,$this->iPId);
			$this->TaskList->oTasks[$this->iPId]->relevel($fParentCompleted/100);
		}
	}

	public function change($p_What,$p_Value){
		switch($p_What){
			case 's': $this->resize($p_Value);break;
			case 'g': $this->relevel($p_Value);break;
			case 'n':
				$this->sName = $p_Value;
				$this->TaskList->bufferUpdate('n',$this->iId,$p_Value);
			break;
			default: return FALSE;
		}
		
		return TRUE;

	}


	public function del(){
		$this->resize(0);
		$qDel = $this->TaskList->db->prepare("DELETE FROM `tasks` WHERE `tasks`.`id` = :id;");
		$qDel->bindValue(":id",$this->iId);
		$iNumRows = $qDel->execute();
		

		unset($this->TaskList->oTasks[$this->iId]);
	}

	public function ArrayList(){
		$aTmpList = array();
		$aListPart = $this->TaskList->getChildsOf($this->iId);
		
		if(empty($aListPart)){
			return null;
		}

		foreach($aListPart as $iListItem => $oChildTask){
			$aTmpList[] = array(
													"n"=>$oChildTask->sName,
													"g"=>$oChildTask->fCompleted,
													"s"=>$oChildTask->fSize,
													"id"=>$oChildTask->iId,
													"c"=>$oChildTask->ArrayList(),
													"p"=>$this->iId
													);
		}

		return $aTmpList;
	}

}
?>
