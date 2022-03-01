// DEFINICIÓN DE VARIABLES.
var anno_ini = '2019'; // Año inicio por defecto
var anno_fin = '2020'; // Año fin por defecto
var pais_origen = ''; // Por defecto, todos los paises.
var pais_destino = ''; // Por defecto, cualquier país.
var min = 1; // Número mínimo de desplazados a mostrar
var max = 1000000; // Número máximo de desplazados a mostrar.

var scriptSource = (function() {
	var scripts = document.getElementsByTagName('script');
	return scripts[scripts.length - 2].src
}());


// Función para transformar "a=b&c=d" en { a:'b', c:'d' }
function parseaQueryString(queryString) 
{
	var params = {};
	var par_valores;

	// Si hay valor
	if (queryString) 
	{
		var keyValues = queryString.split('&'); // Divide por ampersands.

		// Recorro los tokens
		for (var i=0; i < keyValues.length; i++) 
		{
			par_valores = keyValues[i].split('='); // Cada token se divide por el símbolo = 

			console.error('PARSEANDO par_valores[0] '+par_valores[0]+  ' par_valores[1] = '+ par_valores[1]  );

			// Tratamiendo de los valores pasados desde el HTML por parámetro.
			if (par_valores[0]=='anno_ini' && par_valores[1] != 'undefined') anno_ini = parseInt(par_valores[1]);
			else if (par_valores[0] == 'anno_fin' && par_valores[1] != 'undefined') anno_fin = parseInt(par_valores[1]);
			else if (par_valores[0] == 'min' && par_valores[1] != 'undefined') min = parseInt(par_valores[1]);
			else if (par_valores[0] == 'max' && par_valores[1] != 'undefined') max = parseInt(par_valores[1]); 
			else if (par_valores[0] == 'pais' && par_valores[1] != 'undefined') { pais_origen =  decodeURIComponent(par_valores[1]); if (pais_origen=='Cualquiera') {pais_origen='';} }
			else if (par_valores[0] == 'paisdestino' && par_valores[1] != 'undefined') { pais_destino =  decodeURIComponent(par_valores[1]); if (pais_destino=='Cualquiera') {pais_destino='';} }
		}
		
		 console.error('RECUPERADO AÑO INICIO '+anno_ini+', AÑO FIN '+anno_fin+', MINIMO '+min+', MAXIMO '+max+ ', pais_origen='+pais_origen+', pais_destino='+pais_destino );
	}

	return params;
}

var params = parseaQueryString(scriptSource.split('?')[1]);

// Se define una única capa con la información flotante (aparecerá al pasar el ratón sobre las líneas).
var body = d3.select('body')					
	.selectAll('periquin')
	.data([{}]).enter()
	.append('capa_info_flotante')
	.style('position','absolute')
	.style('top', '100px' )
	.style('left', '100px')	
	.style('width', '100px')
	.style('height', '100px')
	.style('z-index', '2000')
	.style('opacity', 0)							// Se pone la opacidad a 0 para ocultarlo.
	.style('background-color', 'tomato')
	.style('font-family', 'Verdana')
	.style('font-size', 'small')
	;


var enlace; // Variable que unirá el origen y el destino de los movimientos

var max_lineas = 10000000; // Número máximo de líneas migratorias (para depuración, reducir)
var color1 = "black"
var color2 = "blue";

// Carga de datos 
//d3.csv("./migraciones_reducido.csv", function(data)    // Cambiar por "migraciones_completo.csv"
d3.csv("./migraciones_completo.csv", function(data)		// Cambiar por "migraciones_reducido.csv"
{
	var links = new Array(); 							// Array de objetos link (las líneas)
	var todas_rutas = new Array();						// Array que contiene, en el mismo orden que los links, los pares origen-destino
	var paises = new Array();							// Array con la lista de países
	var coordenadas = new Array();						// Array con la lista de coordenadas [long,lat] para cada pais
	var total_desp = new Array();						// Array que contiene, en el mismo orden que links y paises, el total de desplazados.
	var infos = new Array();							// Array que tendrá la información a mostrar sobre cade línea
	var total_escrito = 0; 								// Número hasta max_líneas de entradas mostradas en pantalla.
	var suma_desplazados = 0; // Suma a mostrar por pantalla con el total de desplazados de acuerdo a los filtros.

	var tmp_ruta = '';
	var tmp_posicion = 0;

	// Se cargan los datos en nuestro array "links".
	for (i=0; total_escrito < max_lineas && i < data.length ;i++)
	{
		//console.error('pais_origen '+pais_origen+', data[i].Countryoforigin '+data[i].Countryoforigin );
		
		// Si se ha pedido filtrar por país de origen y/o destino
		if ((pais_origen=='' || data[i].Countryoforigin == pais_origen ) && (pais_destino == '' || pais_destino == data[i].Countryofasylum))
		{
			
			// enlace = {type: "LineString", coordinates: [[1.847818*(i+1)	, 23.424076], [1.601554, 42.546245]]} 
			// Si el rango de años es el que esperamos, calculamos la suma para el rango de fecha
			if (parseInt(data[i].Year) >= anno_ini &&  parseInt(data[i].Year) <= anno_fin)
			{
				// Si los desplazamientos están en el rango
				if (parseInt(data[i].RefugeesunderUNHCRsmandate) >= min && parseInt(data[i].RefugeesunderUNHCRsmandate) <= max) 
				{
					// Compone la clave de la ruta p.ej. España-Francia
					tmp_ruta = data[i].Countryoforigin + "_"+data[i].Countryofasylum; 
					
					// La ruta no está registrada
					if (!todas_rutas.includes (tmp_ruta))
					{
						// console.error('tmp_ruta '+tmp_ruta+' NUEVA');
						todas_rutas.push (tmp_ruta); // Guardamos la ruta de los refugiados
						total_desp.push (parseInt(data[i].RefugeesunderUNHCRsmandate)); // Guardamos el número de refugiados.
						
						total_escrito ++ ;
					}
					else // Si buscamos en un rango de años, la ruta puede ya estar registrada, por lo que se sumará el total de desplazados.
					{
						//console.error('tmp_ruta '+tmp_ruta+' YA EXISTÍA');
						tmp_posicion = todas_rutas.indexOf (tmp_ruta); // Posición de la ruta en el array.
						total_desp[tmp_posicion] = parseInt(data[i].RefugeesunderUNHCRsmandate) + total_desp[tmp_posicion]; // Actualizamos el valor en la posición i-ésima.
						//console.error('total_desp['+tmp_posicion+'] = '+total_desp[tmp_posicion]);
					}
				
					// Verificamos si tenemos almacenada la ruta del país, tanto de origen como de destino
					if (!paises.includes (data[i].Countryoforigin)) { paises.push (data[i].Countryoforigin); coordenadas.push ([data[i].long_orig, data[i].lat_orig]); }
					if (!paises.includes (data[i].Countryofasylum)) { paises.push (data[i].Countryofasylum); coordenadas.push ([data[i].long_des, data[i].lat_des]); }
				}
			}
		}
		// else
		// 	console.log(data[i].Year);
		//  console.error('todas_rutas = '+todas_rutas);
	}

	// Variables para el trazado de rutas.
	var personas; // Variable con las personas de cada ruta.
	var orig;
	var dest;
	var total_desp_filtrado = new Array();

	// console.error('paises = '+paises);
	// console.error('todas_rutas = '+todas_rutas);
	// console.error('coordenadas = '+coordenadas);

	var hay_datos = false;
	var texto = ''; // Texto que se mostrará en el popup.

	// Se recorre el array de las rutas. En el array "total_desp" estará la suma de desplazados para esa ruta 
	for (j=0; j < todas_rutas.length; j++)
	{
		// Si el total de desplazados para esa ruta está en el rango que buscamos
		orig = todas_rutas[j].split('_')[0];
		dest = todas_rutas[j].split('_')[1];
		
	
		// Se escribe una línea entre las coordenadas de origen y destino.
		enlace = {type: "LineString", coordinates: [[coordenadas[paises.indexOf(orig)][0], coordenadas[paises.indexOf(orig)][1]], [coordenadas[paises.indexOf(dest)][0], coordenadas[paises.indexOf(dest)][1]]]} ;

		links.push(enlace); // Guardamos el enlace	
		total_desp_filtrado.push(total_desp[j]); // No todos los desplazados cumplen con el criterio.
		// console.error('desplazados='+total_desp[j]+', coordenadas: origen=('+coordenadas[paises.indexOf(orig)][0]+','+coordenadas[paises.indexOf(orig)][1]+'), dest= ('+coordenadas[paises.indexOf(dest)][0]+','+coordenadas[paises.indexOf(dest)][1]+')');

		suma_desplazados = suma_desplazados + total_desp[j]; // Actualizamos el total
		personas = d3.format(",d")(total_desp[j]);  // Se formatea con miles y millones.

		// Se limita la longitud del texto del popup para evitar efectos raros.
		texto = personas +" personas se desplazaron de "+orig+" a "+dest;
		if (texto.length > 75) { texto = texto.substr(0,75) + '...'; }

		// Se almacena el texto en el array de infos y se marca el flag de "hay datos".
		infos.push(texto);
		hay_datos = true;
	}

	// Se pasa el dato al div de información
	// alert (suma_desplazados);
	suma_desplazados=d3.format(",d")(suma_desplazados);  // Se formatea con miles y millones.
	info = d3.select ("div#total").html("En la imagen se muestran "+suma_desplazados+" personas desplazadas de su país.");

	// Si los filtros elegidos no tienen datos, se muestra un alert.
	if (hay_datos == false)
	{
		alert("Los parámetros seleccionados no ofrecen resultados. Actualice los filtros");
	}
				
	//////////////////////// Se mete aquí porque al ser un objeto de carga asíncrona no se garantizaba que fuera del .csv se cargara correctamente.
	// Definimos el objeto SVG y sus atributos (se reutilizarán para configurar el zoom)
	var svg = d3.select("svg#imagen");
	ancho = +svg.attr("width");
	alto = +svg.attr("height");

	// Se configura el objeto SVG donde se va a volcar el mapa.
	svg = d3.select("svg#imagen") //https://stackoverflow.com/questions/51092399/map-zoom-and-pan-in-d3-js-v4-scale-limit
			.attr("width", ancho)
			.attr("height", alto)
			.style("border","none") 
			.style("background-color", "none")
			.call(d3.zoom()
				.on("zoom", function () { svg.attr("transform", d3.event.transform) })
				.scaleExtent([1 ,4]) // Limitamos el zoom a 4x
				.translateExtent([[0, 0], [ancho, alto*1.1]]) // Limitamos el desplazamiento.
			)
			//.attr("transform","translate(100,50),scale(2,2)")
			.append("g")
			;
	
	// Carga la forma del mundo 
	d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson", function(data)
	{
		// Se crea una proyección de Mercator (otra opción es d3.geoNaturalEarth1)
		var proy = d3.geoMercator()		// Proyección de Mercator
			.scale(155)					// Acercamos el mapa
			.center([0,40]) 			// 40 grados al norte
		;   

		// Renderiza la proyección con el geographic path generator
		var path = d3.geoPath().projection(proy)

		// Dibuja el mapa
		var g = svg.append("g") 						// Elemento 'g' para agrupar las formas SVG.
			.selectAll("path")							// Selecciona el elemento path que es de tipo geopath.projection
			.data(data.features)
			.enter().append("path")
			.attr("fill", "#b8b8b8")
			.attr("d", d3.geoPath().projection(proy))
			.style("stroke", "#fff")
			.style("stroke-width", 0.5)
			;

		// Se define la punta de flecha  para los paths // https://bl.ocks.org/anonymous/d1165b950dc50f9ddfcf3c344c05591e
		svg.append('defs').append('marker')
			.attr("id", "marcador")
			.attr("viewBox", "0 -5 10 10")
			.attr("refX", 5.75)
			.attr("refY", 0)
			.attr("markerWidth", 6)
			.attr("markerHeight", 6)
			.attr("orient", "auto")
			.attr("markerUnits", "userSpaceOnUse") // Evita que la punta de flecha crezca con el ancho de línea
			.append('svg:path')
			.attr('d', 'M 0,-5 L 10 ,0 L 0,5')
			.attr('fill', 'black')
			.attr('stroke','black');	

		// Se define la punta de flecha roja para los paths // https://bl.ocks.org/anonymous/d1165b950dc50f9ddfcf3c344c05591e
		svg.append('defs').append('marker')
			.attr("id", "marcadorRojo")
			.attr("viewBox", "0 -5 10 10")
			.attr("refX", 5.75)
			.attr("refY", 0)
			.attr("markerWidth", 6)
			.attr("markerHeight", 6)
			.attr("orient", "auto")
			.attr("markerUnits", "userSpaceOnUse") // Evita que la punta de flecha crezca con el ancho de línea
			.append('svg:path')
			.attr('d', 'M 0,-5 L 10 ,0 L 0,5')
			.attr('fill', 'red')
			.attr('stroke','red');	

		// Variables por defecto de los paths.
		var marcador = 'url(#marcador)';
		var color = color1;
		var ancho_linea = .5;  // Ancho de cada path

		// Recorremos el array con los contenidos (rutas) a mostrar
		for (i=0; i<links.length;i++)
		{
			// Reseteamos a los valores por defecto.
			color = color1;
			marcador = 'url(#marcador)';
			ancho_linea = .5;
			
			if (total_desp_filtrado[i] > 1000000) { ancho_linea = 3.5; color = "red"; marcador = 'url(#marcadorRojo)'; }
			else if (total_desp_filtrado[i] > 100000) ancho_linea = 2;
			else if (total_desp_filtrado[i] > 10000) ancho_linea = 1.5;
			else if (total_desp_filtrado[i] > 1000) ancho_linea = 1;

			// Añadimos la línea en forma de path
			svg.append("path")							// Se añade cada línea del objeto "links".
				.attr("d", path(links[i]))				// Origen y destino de la línea. Serán las coordenadas de la migración.
				.style("fill", "none") 					// Color para cerrar el arco. Se deja vacío.
				.style("stroke", color)					// Color de la línea.
				.style("stroke-width", ancho_linea)		// Ancho de línea 
				.attr('marker-end',marcador	)			// Punta de flecha según la clase "marcador"
				.attr("mi_informacion",infos[i])
				.on("mouseover", function () {
						var x = d3.event.pageX+10						// Se captura la coordenada x del onmouseover
						var y = d3.event.pageY							// Se captura la coordenada y
						d3.select('body')
							.select('capa_info_flotante')				// Se selecciona el tooltip
							.html(d3.select(this).attr('mi_informacion'))
							.style('opacity',1)   						// Se cambia la opacidad para mostrarlo.
							.style('position','relative')
							.style('height', '50px')
							.style('left', x+'px')  					// Se indica la posición x del ratón. OJO! tiene que estar en formato '1234px'
							.style('top', y+'px'); 						// Se indica la posición y del ratón. OJO! tiene que estar en formato '1234px'

				} )
				.on("mouseout", function () {
						// d3.select(this).style("stroke", color)			// Cambia la línea de color 
						d3.select('body')
							.select('capa_info_flotante')				// Se selecciona el tooltip
							.style('opacity',0)   						// Se cambia la opacidad para mostrarlo.
							.style('left', '100px')  					// Se indica la posición x del ratón. OJO! tiene que estar en formato '1234px'
							.style('top', '100px'); 					// Se indica la posición y del ratón. OJO! tiene que estar en formato '1234px'

				} )
				.on("click", function() {acercar()})
				;
		}
	})
});
