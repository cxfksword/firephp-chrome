# firephp-chrome
A firephp log extension for chrome


# Support Zlib deflate

server.php

```
<?php   
header('X-FirePHP-Encoding:zlib-deflate', true);

$data = base64_encode(zlib_encode("##########################################################################", ZLIB_ENCODING_DEFLATE));
$firephp->fb($data, FirePHP::LOG);  
?>
```