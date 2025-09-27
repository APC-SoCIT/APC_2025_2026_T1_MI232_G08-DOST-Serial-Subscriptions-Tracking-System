<?php

use Illuminate\Support\Facades\Route;

// Default Laravel welcome page
Route::get('/', function () {
    return view('welcome');
});


Route::get('/login', function () {
    return view('login'); 
});
