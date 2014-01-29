<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <title>ChEBI OntoViz</title>

    <h1 style="text-align: center">ChEBI Ontology Vizualisation</h1>
</head>

<body>
<div style="text-align: center">
    <form action="result" method="post">
        Enter ChEBI ID:
        <input type="text" name="chebiId">
        <input type="submit" value="submit" onclick="document.getElementById('loading').style.display = 'block';">
    </form>
</div>
<div id="loading" style="text-align: center">
    <div id="loadingtext">
        <b>Loading </b>
            <img src="images/loading.gif" align="middle" border="0"/>
    </div>
</div>


<script type="text/javascript">
    document.getElementById("loading").style.display = "none";
</script>


</body>
</html>
