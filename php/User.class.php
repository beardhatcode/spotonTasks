<?php
/**
 * milen
 **/
class User
{
	public $db=null;
	public $user=array('name'	=>'annonymous',
										 'id'		=>	0);

	function __construct($p_iId,$db){
		$this->db = $db;
		if(is_null($p_iId)){
			//log in this user
			if(isset($_SESSION['id'],$_SESSION['sid'])){
				$this->getUser($_SESSION['id'],$_SESSION['sid']);
            }elseif(isset($_POST['uId'],$_POST['uSid'])){
				$this->getUser($_POST['uId'],$_POST['uSid']);
            }
		}else{
			//cdde for other users				
			$this->getUser($p_iId);
		}
	}

	public function getUser($p_iId,$p_sSid = null){
		if(!is_numeric($p_iId)){
			return FALSE;				
		}

		if(is_null($p_sSid)){
			$qUser = $this->db->prepare('SELECT * from users WHERE id=?');	
			$qUser->execute(array($p_iId));
		}else{
			$qUser = $this->db->prepare('SELECT * from users WHERE id=? AND sid=?');	
			$qUser->execute(array($p_iId,$p_sSid));
		}

		if($qUser->rowCount() == 1){
			$this->user  = $qUser->fetch();
			return TRUE;
		}else{
			return FALSE;				
		}

	}
	
	public function requestLogin(){
		if($this->user['id'] == 0){
			DataPlotter::requestAction('login');
		}
	}

	public function createList($p_sListData){
		if($this->user['id'] == 0){
			DataPlotter::requestAction('login');
			DataPlotter::warn("only logged in users can create a list!");
			return false;		
		}

		$aNewvalues = json_decode($p_sListData,true);
		if(!is_null($aNewvalues)){
			$aMainTask = array();
			$updateVals = array();

			foreach($aNewvalues as $newVal){	
                
                if($newVal['id'] != 0){
					$updateVals['add|'.$newVal['id']]=($newVal['p']==0 ? 'null':$newVal['p']);
					$updateVals['s|'.$newVal['id']]=round($newVal['s'],2);
					$updateVals['g|'.$newVal['id']]=round($newVal['g'],2); 
					$updateVals['n|'.$newVal['id']]=$newVal['n'];
				}
                
                if($newVal['id'] == '0'){
					$aMainTask = $newVal;				
				}
			}
		}else{
			DataPlotter::warn('JSON could not be decoded');
			return FALSE;
		}
	
		$qAddList = $this->db->prepare('INSERT INTO `lists` (`name`, `owner`) VALUES (:name, :owner)');
		$qAddList->execute(array('name'=>$aMainTask['n'],'owner'=>$this->user['id']));
		if($qAddList->rowCount() == 1){
			$iId = $this->db->lastInsertId();
			
			$qPrivileges = $this->db->prepare('INSERT INTO `privileges` (`user`, `list`, `own`, `view`, `edit`) 
																				 VALUES (:user, :list, 1, 1, 1)');
			if($qPrivileges->execute(array("list"=>$iId,"user"=>$this->user['id']))){
				$oList = new TaskList($iId,$this->db,$this);
				$oList->update($updateVals);
			}
		    $oList->ArrayList();
            $this->getLists();
            DataPlotter::succeeded();
        }else{
		    DataPlotter::failed();
        }
	
	}
	
	public function getLists(){
		$qUserList = $this->db->prepare('SELECT lists . * 
												FROM  `privileges` 
												RIGHT JOIN  `lists` ON  `privileges`.`list` =  `lists`.`id` 
												WHERE `privileges`.`user` =:user
												LIMIT 0 , 30');				
		$qUserList->execute(array('user'=>$this->user['id']));
		
		$aUserLists = $qUserList->fetchAll();
		DataPlotter::data('lists',$aUserLists);
		return $aUserLists;
	}
	

	public function login($p_sName,$p_sPass){


			$qUser = $this->db->prepare('SELECT * from users WHERE name=:name AND pass=:pass');	
			$qUser->execute(array("name"=>$p_sName,"pass"=>md5($p_sPass)));
			
			if($qUser->rowCount() == 1){
				$this->user = $qUser->fetch();
				$_SESSION['id'] = $this->user['id'];
				
				$qUpdateSid = $this->db->prepare('UPDATE users SET sid=:sid WHERE id=:id');
				
				$newSid = md5(mt_rand());
				$_SESSION['sid'] = $newSid;
				$qUpdateSid->execute(array("sid"=>$newSid,"id"=>$this->user['id']));
				
				$this->user['sid'] = $newSid;
				return true;
			}else{
			$this->user = array('name'	=>'annonymous',
													 'id'		=>	0);
							
			return false;
			}

	}

	public function checkLogin(){
		if($this->user['id'] != 0){
				DataPlotter::user(array('logged'=>true,'id'=>$this->user['id'],'sid'=>$this->user['sid'],'name'=>$this->user['name']));
		}else{
				DataPlotter::user(array('logged'=>false,'id'=>$this->user['id'],'name'=>$this->user['name']));
		}
	}

}
?>
