<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Private chat channels
Broadcast::private('chat.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Public group chat channels
Broadcast::channel('chat.{chatId}', function ($user, $chatId) {
    return true; // Group chats are public to all members
});
