<?php
session_start();
$_SESSION['test'] = 'OK';
echo 'SET: ' . session_id();
