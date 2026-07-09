<!doctype html>

<html
        lang="en"
        class="layout-navbar-hidden layout-menu-fixed layout-compact"
        dir="ltr"
        data-skin="default"
        data-assets-path="/<?php print $directory; ?>/quan-ly/assets/"
        data-template="vertical-menu-template-no-customizer"
        data-bs-theme="light">
<head>
    <meta charset="utf-8"/>
    <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0"/>
    <?php print $head; ?>
    <title><?php print $head_title; ?></title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
    <link
            href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&ampdisplay=swap"
            rel="stylesheet"/>
    <?php print $styles; ?>
</head>

<body>
<!--Chọn file excel-->
<?php print $page_top; ?>
<?php print $page; ?>
<?php print $page_bottom; ?>

<div id="back-to-top"
     class=" fixed bottom-4 right-4 lg:bottom-10 lg:right-10 w-12 h-12 rounded-full flex items-center justify-center bg-primary cursor-pointer">
    <i class="iconify text-2xl text-white" data-icon="lucide:move-up"></i>
</div>
<?php print $scripts; ?>
</body>
</html>
