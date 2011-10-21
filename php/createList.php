<?php
	
	$aNevvalues = json_decode($_GET["data"],true);
	if(!is_null($aNevvalues)){
		$updateVals = array();
		foreach($aNevvalues as $newVal){	
			if($newVal['id'] != 0){
				$updateVals['add|'.$newVal['id']]=($newVal['p']==0 ? 'null':$newVal['p']);
				$updateVals['s|'.$newVal['id']]=$newVal['s'];
				$updateVals['g|'.$newVal['id']]=$newVal['g']; 
			}
		}
	}else{
		echo "JSON could not be decoded:";
	
	}
?>
