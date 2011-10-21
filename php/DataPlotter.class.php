<?php
/**
 * Output module
 * gains info via
 * DataPlotter::warn|notice|failed|suceeded(var)
 **/
class DataPlotter
{
	static $succes=false;
	static $critical=array();
	static $warnings=array();
	static $notices=array();
	static $errors=array();
	static $user=array();
	static $data=array();
	static $requestedActions=array();

	function __construct(){
	}

	static function succeeded(){
		self::$succes=true;
	}

	static function failed(){
		self::$succes=false;
	}

	static function notice($mValue){
		self::$notices[] = $mValue;
	}

	static function user($mValue){
		self::$user = $mValue;
	}

	static function warn($mValue){
		self::$warnings[] = $mValue;
	}

	static function error($mValue){}

	static function data($sName,$mData){
		self::$data[$sName] = $mData;
	}

	static function requestAction($sAction){
		self::$requestedActions[] = $sAction;	
	}

	static function AJAX(){
		$outputArray=self::$data;
		
		$outputArray['succes'] = self::$succes;
		
		if(!empty(self::$warnings)){
			$outputArray['warnings'] = self::$warnings;
		}
		
		if(!empty(self::$notices)){
			$outputArray['notices'] = self::$notices;
		}
		
		if(!empty(self::$requestedActions)){
			$outputArray['requestedActions'] = self::$requestedActions;
		}

		$outputArray['user'] = self::$user;

		echo  preg_replace("/\\\\u([a-f0-9]{4})/e", "iconv('UCS-4LE','UTF-8',pack('V', hexdec('U$1')))", json_encode($outputArray));
	}
}
?>
