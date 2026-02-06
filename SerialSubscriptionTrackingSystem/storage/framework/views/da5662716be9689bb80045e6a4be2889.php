<?php $attributes ??= new \Illuminate\View\ComponentAttributeBag;

$__newAttributes = [];
$__propNames = \Illuminate\View\ComponentAttributeBag::extractPropNames((['headers']));

foreach ($attributes->all() as $__key => $__value) {
    if (in_array($__key, $__propNames)) {
        $$__key = $$__key ?? $__value;
    } else {
        $__newAttributes[$__key] = $__value;
    }
}

$attributes = new \Illuminate\View\ComponentAttributeBag($__newAttributes);

unset($__propNames);
unset($__newAttributes);

foreach (array_filter((['headers']), 'is_string', ARRAY_FILTER_USE_KEY) as $__key => $__value) {
    $$__key = $$__key ?? $__value;
}

$__defined_vars = get_defined_vars();

foreach ($attributes->all() as $__key => $__value) {
    if (array_key_exists($__key, $__defined_vars)) unset($$__key);
}

unset($__defined_vars, $__key, $__value); ?>

<div class="flex flex-col gap-3">
    <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">Headers</h2>
    <div class="flex flex-col">
        <?php $__currentLoopData = $headers; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $key => $value): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
        <div class="flex max-w-full items-baseline gap-2 h-10 text-sm font-mono">
            <div class="uppercase text-neutral-500 dark:text-neutral-400 shrink-0"><?php echo e($key); ?></div>
            <div class="min-w-6 grow h-3 border-b-2 border-dotted border-neutral-300 dark:border-white/20"></div>
            <div class="truncate text-neutral-900 dark:text-white">
                <span data-tippy-content="<?php echo e($value); ?>">
                    <?php echo e($value); ?>

                </span>
            </div>
        </div>
        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
    </div>
</div>
<<<<<<<< HEAD:SerialSubscriptionTrackingSystem/storage/framework/views/757094a85197836a723d43fe117572ef.php
<?php /**PATH C:\Users\Ren Henry\APC_2025_2026_T1_MI232_G08-DOST-Serial-Subscriptions-Tracking-System\SerialSubscriptionTrackingSystem\vendor\laravel\framework\src\Illuminate\Foundation\Providers/../resources/exceptions/renderer/components/request-header.blade.php ENDPATH**/ ?>
========
<?php /**PATH C:\Users\Mohasien\Documents\GitHub\APC_2025_2026_T1_MI232_G08-DOST-Serial-Subscriptions-Tracking-System\SerialSubscriptionTrackingSystem\vendor\laravel\framework\src\Illuminate\Foundation\Providers/../resources/exceptions/renderer/components/request-header.blade.php ENDPATH**/ ?>
>>>>>>>> 25936b88d5acb16a830c4feffb2468228fa25ed1:SerialSubscriptionTrackingSystem/storage/framework/views/da5662716be9689bb80045e6a4be2889.php
