<!DOCTYPE html>
<html lang="<?php echo e(str_replace('_', '-', app()->getLocale())); ?>">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">

        <title inertia><?php echo e(config('app.name', 'Laravel')); ?></title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        <?php echo app('Tighten\Ziggy\BladeRouteGenerator')->generate(); ?>
        <?php echo app('Illuminate\Foundation\Vite')->reactRefresh(); ?>
        <?php echo app('Illuminate\Foundation\Vite')(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"]); ?>
        <?php if (!isset($__inertiaSsrDispatched)) { $__inertiaSsrDispatched = true; $__inertiaSsrResponse = app(\Inertia\Ssr\Gateway::class)->dispatch($page); }  if ($__inertiaSsrResponse) { echo $__inertiaSsrResponse->head; } ?>
    </head>
    <body class="font-sans antialiased">
        <?php if (!isset($__inertiaSsrDispatched)) { $__inertiaSsrDispatched = true; $__inertiaSsrResponse = app(\Inertia\Ssr\Gateway::class)->dispatch($page); }  if ($__inertiaSsrResponse) { echo $__inertiaSsrResponse->body; } elseif (config('inertia.use_script_element_for_initial_page')) { ?><script data-page="app" type="application/json"><?php echo json_encode($page); ?></script><div id="app"></div><?php } else { ?><div id="app" data-page="<?php echo e(json_encode($page)); ?>"></div><?php } ?>
    </body>
</html>
<<<<<<<< HEAD:SerialSubscriptionTrackingSystem/storage/framework/views/4f3be57203e3c3b084f409ffe731dbf1.php
<?php /**PATH C:\Users\mypc\Documents\Cyber Sentinels\APC_2025_2026_T1_MI232_G08-DOST-Serial-Subscriptions-Tracking-System\SerialSubscriptionTrackingSystem\resources\views/app.blade.php ENDPATH**/ ?>
========
<?php /**PATH C:\Users\Ren Henry\APC_2025_2026_T1_MI232_G08-DOST-Serial-Subscriptions-Tracking-System\SerialSubscriptionTrackingSystem\resources\views/app.blade.php ENDPATH**/ ?>
>>>>>>>> 8cccb39a44fb2cb2c72fdc475c901683ce9beed5:SerialSubscriptionTrackingSystem/storage/framework/views/efc3dc63dfb18d728505a3267494c99a.php
