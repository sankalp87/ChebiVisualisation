<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="com.openscience.chebi.OntoViz" %>

<html>
<head>

    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <title>ChEBI OntoViz</title>

    <h1 style="text-align: center">
        <a href="index.jsp">ChEBI Ontology Vizualisation</a>
    </h1>
    <a href="index.jsp">Back to Search</a>

    <link type="text/css" href="styles/base.css" rel="stylesheet"/>
    <link type="text/css" href="styles/claro.css" rel="stylesheet"/>

    <%
        String chebiId = (String) request.getParameter("chebiId");
        OntoViz ontoViz = new OntoViz();
        ontoViz.setChebiId(chebiId);
    %>


</head>

<body>
<table>
    <tr>
        <td width="80px" id="left-container" align="left">
            <div id="move">
                <img src="images/panning.jpg" alt="panning" width="80" height="80" usemap="#panning"/>
                <map name="panning">
                    <area shape="poly" coords="26,26,52,26,39,1,26,26,27,25,26,25" title="move up"
                          onclick="panningMove(1)" nohref>
                    <area shape="poly" coords="1,39,26,27,27,52,0,39" title="move left" onclick="panningMove(2)" nohref>
                    <area shape="poly" coords="27,52,53,53,40,78,26,52,27,52,28,52" title="move down"
                          onclick="panningMove(3)" nohref>
                    <area shape="poly" coords="53,27,53,53,78,39,52,26,53,27" title="move right"
                          onclick="panningMove(4)" nohref>
                </map>
            </div>
        </td>
        <td>
            <div id=ontology-view>
                <b>Graph compression </b> <br/>
                <br/>
                <input type="radio" name="ontologyView" value="SV" onclick="simplifiedView()" checked> Compact view
                <br/>
                <input type="radio" name="ontologyView" value="OV" onclick="originalView()"> Expanded view
            </div>
        </td>
    </tr>
    <tr>
        <td width="80px" id="left-container" align="center">
            <div id=sliderZoom class="claro">
                <div id="vertical"></div>
            </div>
        </td>
        <td>
            <script>
                <%=ontoViz.getJSONData()%>
            </script>

            <script language="javascript" type="text/javascript" src="javascript/thejit.js"></script>
            <script language="javascript" type="text/javascript" src="javascript/ontologyVisualisation.js"></script>
            <script type='text/javascript'>
                window.onload = init;
            </script>
            <script>dojoConfig = {parseOnLoad:true}</script>
            <script src='javascript/dojo.xd.js'></script>
            <script language="javascript" type="text/javascript" src="javascript/sliderZoom.js"></script>
            <script language="javascript" type="text/javascript" src="javascript/excanvas.js"></script>

            <div id="center-container">
                <div id="infovis">

                </div>
            </div>
            <div id="log"></div>
        </td>
    </tr>
</table>

</body>
</html>
