/* ==========================================================================
   KRODOSEN — product data (sample catalogue)
   31 part numbers across MLCC, sensors, semiconductors and connectors.
   Consumed by products.html (catalogue table) and product.html (detail page).

   Each record:
     id      part number / primary key
     cat     mlcc | sensor | chip | connector
     pill    short technical label shown in the table badge (not translated)
     pkg     package / case size
     status  stock | build
     key     key specification line
     specs   [[labelKey, value], ...]  -> labelKey resolved as i18n 'sp.<labelKey>'
     img     square product image (generated)
     ds      datasheet PDF (generated)
   ========================================================================== */
(function () {
  'use strict';

  function spec() {
    var a = [], i;
    for (i = 0; i < arguments.length; i += 2) a.push([arguments[i], arguments[i + 1]]);
    return a;
  }

  /* dielectric -> temperature characteristic / operating range / dissipation factor */
  var DIEL = {
    C0G: { tcc: '\u00b130 ppm/\u00b0C (\u221255 to +125 \u00b0C)', temp: '\u221255 to +125 \u00b0C', df: '\u2264 0.1%' },
    X5R: { tcc: '\u00b115% (\u221255 to +85 \u00b0C)', temp: '\u221255 to +85 \u00b0C', df: '\u2264 10%' },
    X6S: { tcc: '\u00b122% (\u221255 to +105 \u00b0C)', temp: '\u221255 to +105 \u00b0C', df: '\u2264 10%' },
    X7R: { tcc: '\u00b115% (\u221255 to +125 \u00b0C)', temp: '\u221255 to +125 \u00b0C', df: '\u2264 5%' },
    X7S: { tcc: '\u00b122% (\u221255 to +125 \u00b0C)', temp: '\u221255 to +125 \u00b0C', df: '\u2264 5%' }
  };

  var REEL = {
    '0402': '10,000 pcs', '0603': '4,000 pcs', '0805': '3,000 pcs',
    '1206': '2,000 pcs', '1210': '1,000 pcs', '1812': '500 pcs', '2220': '500 pcs'
  };

  function mlcc(id, pkg, dielectric, cap, volt, tol, key) {
    var d = DIEL[dielectric];
    return {
      id: id, cat: 'mlcc', pill: 'MLCC', pkg: pkg, status: 'stock', key: key,
      specs: spec(
        'dielectric', dielectric,
        'capacitance', cap,
        'voltage', volt,
        'tolerance', tol,
        'case', pkg + ' (EIA)',
        'tcc', d.tcc,
        'tempRange', d.temp,
        'ir', '\u2265 10 G\u03a9 \u00b7 100 VDC, 60 s',
        'df', d.df,
        'term', 'Ni barrier / Sn plating',
        'pack', 'Tape & reel \u00b7 ' + (REEL[pkg] || '\u2014')
      )
    };
  }

  var LIST = [
    /* ---------------- MLCC ---------------- */
    mlcc('KRC0402X5R104K6R3', '0402', 'X5R', '100 nF', '6.3 V', '\u00b110%', 'X5R \u00b7 100 nF \u00b7 6.3 V \u00b7 \u00b110%'),
    mlcc('KRC0402X6S105M6R3', '0402', 'X6S', '1 \u00b5F', '6.3 V', '\u00b120%', 'X6S \u00b7 1 \u00b5F \u00b7 6.3 V \u00b7 \u00b120%'),
    mlcc('KRC0603X7R224K50', '0603', 'X7R', '220 nF', '50 V', '\u00b110%', 'X7R \u00b7 220 nF \u00b7 50 V \u00b7 \u00b110%'),
    mlcc('KRC0603X7S474K25', '0603', 'X7S', '470 nF', '25 V', '\u00b110%', 'X7S \u00b7 470 nF \u00b7 25 V \u00b7 \u00b110%'),
    mlcc('KRC0805X5R106K16', '0805', 'X5R', '10 \u00b5F', '16 V', '\u00b110%', 'X5R \u00b7 10 \u00b5F \u00b7 16 V \u00b7 \u00b110%'),
    mlcc('KRC0805C0G102J100', '0805', 'C0G', '1 nF', '100 V', '\u00b15%', 'C0G \u00b7 1 nF \u00b7 100 V \u00b7 \u00b15%'),
    mlcc('KRC1206X7R106K25', '1206', 'X7R', '10 \u00b5F', '25 V', '\u00b110%', 'X7R \u00b7 10 \u00b5F \u00b7 25 V \u00b7 \u00b110%'),
    mlcc('KRC1210X7R225K100', '1210', 'X7R', '2.2 \u00b5F', '100 V', '\u00b110%', 'X7R \u00b7 2.2 \u00b5F \u00b7 100 V \u00b7 \u00b110%'),
    mlcc('KRC1812X7S107M100', '1812', 'X7S', '100 \u00b5F', '100 V', '\u00b120%', 'X7S \u00b7 100 \u00b5F \u00b7 100 V \u00b7 \u00b120%'),
    mlcc('KRC2220X7R475K102', '2220', 'X7R', '4.7 \u00b5F', '1000 V', '\u00b110%', 'X7R \u00b7 4.7 \u00b5F \u00b7 1000 V \u00b7 \u00b110%'),

    /* ---------------- SENSORS ---------------- */
    {
      id: 'KRS-NTC10K3950F', cat: 'sensor', pill: 'Sensor', pkg: '0603', status: 'stock',
      key: 'NTC \u00b7 10 k\u03a9 \u00b7 \u00b11% \u00b7 B = 3950 K',
      specs: spec(
        'resistance', '10 k\u03a9 at 25 \u00b0C',
        'bconstant', '3950 K \u00b11%',
        'tolerance', '\u00b11%',
        'tempRange', '\u221240 to +150 \u00b0C',
        'thermalTime', '\u2264 5 s (still air)',
        'dissipation', '\u2265 1.0 mW/\u00b0C',
        'ratedPower', '100 mW',
        'term', 'Ni / Sn plated',
        'pack', 'Tape & reel \u00b7 4,000 pcs'
      )
    },
    {
      id: 'KRS-NTC100K4250F', cat: 'sensor', pill: 'Sensor', pkg: '0805', status: 'stock',
      key: 'NTC \u00b7 100 k\u03a9 \u00b7 \u00b11% \u00b7 B = 4250 K',
      specs: spec(
        'resistance', '100 k\u03a9 at 25 \u00b0C',
        'bconstant', '4250 K \u00b11%',
        'tolerance', '\u00b11%',
        'tempRange', '\u221240 to +150 \u00b0C',
        'thermalTime', '\u2264 6 s (still air)',
        'dissipation', '\u2265 1.0 mW/\u00b0C',
        'ratedPower', '100 mW',
        'term', 'Ni / Sn plated',
        'pack', 'Tape & reel \u00b7 3,000 pcs'
      )
    },
    {
      id: 'KRS-HALL-A3144', cat: 'sensor', pill: 'Sensor', pkg: 'SOT-23', status: 'stock',
      key: 'Hall switch \u00b7 3.5\u201324 V \u00b7 open collector',
      specs: spec(
        'supply', '3.5 \u2013 24 V',
        'output', 'Open collector, 25 mA sink',
        'operatePoint', 'Bop 35 G typ.',
        'releasePoint', 'Brp 25 G typ.',
        'outputCurrent', '25 mA',
        'tempRange', '\u221240 to +150 \u00b0C',
        'pack', 'Tape & reel \u00b7 3,000 pcs'
      )
    },
    {
      id: 'KRS-HALL-L120', cat: 'sensor', pill: 'Sensor', pkg: 'SOT-23', status: 'stock',
      key: 'Linear Hall \u00b7 ratiometric 1.65\u20133.3 V',
      specs: spec(
        'supply', '3.0 \u2013 3.6 V',
        'quiescent', '1.65 V (ratiometric)',
        'sensitivity', '2.5 mV/G',
        'linearity', '\u00b11% of full scale',
        'bandwidth', '20 kHz',
        'tempRange', '\u221240 to +125 \u00b0C',
        'pack', 'Tape & reel \u00b7 3,000 pcs'
      )
    },
    {
      id: 'KRS-CUR-05A', cat: 'sensor', pill: 'Sensor', pkg: 'SOIC-8', status: 'stock',
      key: 'Open-loop current \u00b7 \u00b15 A \u00b7 2.5 V ref',
      specs: spec(
        'range', '\u00b15 A',
        'supply', '4.5 \u2013 5.5 V',
        'sensitivity', '185 mV/A',
        'reference', '2.5 V',
        'isolation', '2.1 kV rms / 1 min',
        'accuracy', '\u00b11.5% of full scale',
        'bandwidth', '80 kHz',
        'tempRange', '\u221240 to +125 \u00b0C',
        'pack', 'Tape & reel \u00b7 2,500 pcs'
      )
    },
    {
      id: 'KRS-CUR-30A', cat: 'sensor', pill: 'Sensor', pkg: 'SOIC-8', status: 'build',
      key: 'Open-loop current \u00b7 \u00b130 A \u00b7 1.2 kV isolation',
      specs: spec(
        'range', '\u00b130 A',
        'supply', '4.5 \u2013 5.5 V',
        'sensitivity', '66 mV/A',
        'reference', '2.5 V',
        'isolation', '1.2 kV rms / 1 min',
        'accuracy', '\u00b12% of full scale',
        'bandwidth', '50 kHz',
        'tempRange', '\u221240 to +125 \u00b0C',
        'pack', 'Tape & reel \u00b7 2,500 pcs'
      )
    },
    {
      id: 'KRS-ALS-16D', cat: 'sensor', pill: 'Sensor', pkg: '2.0 \u00d7 2.0 mm', status: 'stock',
      key: 'Ambient light \u00b7 16-bit \u00b7 I\u00b2C \u00b7 0.01\u201364 klx',
      specs: spec(
        'supply', '1.7 \u2013 3.6 V',
        'resolution', '16-bit',
        'interface', 'I\u00b2C, up to 400 kHz',
        'range', '0.01 \u2013 64 klx',
        'accuracy', '\u00b110% (visible light)',
        'iq', '1.2 \u00b5A standby',
        'tempRange', '\u221240 to +85 \u00b0C',
        'pack', 'Tape & reel \u00b7 3,000 pcs'
      )
    },

    /* ---------------- SEMICONDUCTORS ---------------- */
    {
      id: 'KRM30N06DFN', cat: 'chip', pill: 'MOSFET', pkg: 'DFN 5\u00d76', status: 'stock',
      key: 'N-ch \u00b7 30 V \u00b7 6 A \u00b7 RDS(on) 18 m\u03a9',
      specs: spec(
        'vds', '30 V',
        'id', '6 A (Tc = 25 \u00b0C)',
        'rds', '18 m\u03a9 @ VGS = 10 V',
        'vgsth', '1.0 \u2013 2.5 V',
        'qg', '6.8 nC',
        'ciss', '520 pF',
        'tj', '\u221255 to +150 \u00b0C',
        'pack', 'Tape & reel \u00b7 3,000 pcs'
      )
    },
    {
      id: 'KRM60N15TO', cat: 'chip', pill: 'MOSFET', pkg: 'TO-252', status: 'stock',
      key: 'N-ch \u00b7 60 V \u00b7 15 A \u00b7 RDS(on) 42 m\u03a9',
      specs: spec(
        'vds', '60 V',
        'id', '15 A (Tc = 25 \u00b0C)',
        'rds', '42 m\u03a9 @ VGS = 10 V',
        'vgsth', '2.0 \u2013 4.0 V',
        'qg', '12.5 nC',
        'ciss', '980 pF',
        'tj', '\u221255 to +175 \u00b0C',
        'pack', 'Tape & reel \u00b7 2,500 pcs'
      )
    },
    {
      id: 'KRD-SS34', cat: 'chip', pill: 'Diode', pkg: 'SMA', status: 'stock',
      key: 'Schottky \u00b7 40 V \u00b7 3 A \u00b7 0.45 V',
      specs: spec(
        'vrrm', '40 V',
        'ifav', '3 A',
        'vf', '0.45 V @ 3 A',
        'ifsm', '100 A (8.3 ms)',
        'trr', 'Schottky \u2014 no recovery',
        'tj', '\u221255 to +150 \u00b0C',
        'pack', 'Tape & reel \u00b7 5,000 pcs'
      )
    },
    {
      id: 'KRD-US1M', cat: 'chip', pill: 'Diode', pkg: 'SMA', status: 'stock',
      key: 'Fast recovery \u00b7 1000 V \u00b7 1 A \u00b7 75 ns',
      specs: spec(
        'vrrm', '1000 V',
        'ifav', '1 A',
        'vf', '1.7 V @ 1 A',
        'ifsm', '30 A (8.3 ms)',
        'trr', '75 ns',
        'tj', '\u221255 to +150 \u00b0C',
        'pack', 'Tape & reel \u00b7 5,000 pcs'
      )
    },
    {
      id: 'KRIC-LDO1117-33', cat: 'chip', pill: 'PMIC', pkg: 'SOT-223', status: 'stock',
      key: 'LDO \u00b7 3.3 V \u00b7 1 A \u00b7 1.1 V dropout',
      specs: spec(
        'vin', '4.8 \u2013 15 V',
        'vout', '3.3 V \u00b11%',
        'iout', '1 A',
        'dropout', '1.1 V @ 1 A',
        'psrr', '60 dB @ 1 kHz',
        'iq', '5 mA',
        'tempRange', '\u221240 to +125 \u00b0C',
        'pack', 'Tape & reel \u00b7 2,500 pcs'
      )
    },
    {
      id: 'KRIC-BUCK05A', cat: 'chip', pill: 'PMIC', pkg: 'SOP-8EP', status: 'stock',
      key: 'Sync buck \u00b7 5 V \u00b7 3 A \u00b7 500 kHz',
      specs: spec(
        'vin', '8 \u2013 36 V',
        'vout', '5 V \u00b12%',
        'iout', '3 A',
        'fsw', '500 kHz',
        'eff', 'up to 92%',
        'tempRange', '\u221240 to +125 \u00b0C',
        'pack', 'Tape & reel \u00b7 2,500 pcs'
      )
    },
    {
      id: 'KRIC-ESD0504', cat: 'chip', pill: 'Protection', pkg: 'SOT-23-6', status: 'stock',
      key: '4-line ESD array \u00b7 \u00b115 kV air \u00b7 0.4 pF',
      specs: spec(
        'lines', '4 (bidirectional)',
        'vrwdm', '5.0 V',
        'vclamp', '12 V @ 1 A (8/20 \u00b5s)',
        'cap', '0.4 pF typ.',
        'esd', '\u00b115 kV air / \u00b18 kV contact',
        'pack', 'Tape & reel \u00b7 3,000 pcs'
      )
    },
    {
      id: 'KRIC-RS485', cat: 'chip', pill: 'Interface', pkg: 'SOP-8', status: 'build',
      key: 'Half-duplex transceiver \u00b7 20 Mbps \u00b7 \u00b115 kV',
      specs: spec(
        'duplex', 'Half duplex',
        'rate', '20 Mbps',
        'supply', '3.0 \u2013 3.6 V',
        'busProt', '\u00b115 kV ESD (HBM)',
        'nodes', 'up to 256 bus loads',
        'tempRange', '\u221240 to +125 \u00b0C',
        'pack', 'Tape & reel \u00b7 2,500 pcs'
      )
    },

    /* ---------------- CONNECTORS ---------------- */
    {
      id: 'KRO-BTB40-05', cat: 'connector', pill: 'Connector', pkg: '40P', status: 'stock',
      key: 'Board-to-board \u00b7 40 pos \u00b7 0.5 mm \u00b7 0.5 A',
      specs: spec(
        'pitch', '0.5 mm',
        'positions', '40 (2 \u00d7 20)',
        'current', '0.5 A / contact',
        'vrating', '50 V AC/DC',
        'height', '3.0 mm (mated)',
        'cycles', '500',
        'plating', 'Selective gold 0.2 \u00b5m',
        'tempRange', '\u221240 to +85 \u00b0C'
      )
    },
    {
      id: 'KRO-WTB10-254', cat: 'connector', pill: 'Connector', pkg: '10P', status: 'stock',
      key: 'Wire-to-board \u00b7 10 pos \u00b7 2.54 mm \u00b7 10 A',
      specs: spec(
        'pitch', '2.54 mm',
        'positions', '10 (1 \u00d7 10)',
        'current', '10 A / contact',
        'vrating', '250 V AC/DC',
        'wire', 'AWG 22 \u2013 16',
        'cycles', '50',
        'plating', 'Sn over Ni',
        'tempRange', '\u221240 to +105 \u00b0C'
      )
    },
    {
      id: 'KRO-WTB04-20', cat: 'connector', pill: 'Connector', pkg: '4P', status: 'stock',
      key: 'Wire-to-board \u00b7 4 pos \u00b7 2.0 mm \u00b7 3 A',
      specs: spec(
        'pitch', '2.0 mm',
        'positions', '4 (1 \u00d7 4)',
        'current', '3 A / contact',
        'vrating', '125 V AC/DC',
        'wire', 'AWG 26 \u2013 22',
        'cycles', '30',
        'plating', 'Sn over Ni',
        'tempRange', '\u221240 to +105 \u00b0C'
      )
    },
    {
      id: 'KRO-CIR08-IP67', cat: 'connector', pill: 'Connector', pkg: 'M12', status: 'build',
      key: 'Circular sealed \u00b7 8 pos \u00b7 IP67 \u00b7 10 A',
      specs: spec(
        'positions', '8 (A-coded)',
        'current', '10 A / contact',
        'vrating', '30 V AC/DC',
        'ip', 'IP67 / IP68 when mated',
        'contacts', '\u00d8 1.0 mm',
        'cycles', '100',
        'mount', 'Panel mount, front fastening',
        'shell', 'Zinc die-cast, Ni plated',
        'cableOd', '4 \u2013 6 mm'
      )
    },
    {
      id: 'KRO-CIR12-IP67', cat: 'connector', pill: 'Connector', pkg: 'M12', status: 'stock',
      key: 'Circular sealed \u00b7 12 pos \u00b7 IP67 \u00b7 10 A',
      specs: spec(
        'positions', '12 (A-coded)',
        'current', '10 A / contact',
        'vrating', '30 V AC/DC',
        'ip', 'IP67 / IP68 when mated',
        'contacts', '\u00d8 1.0 mm',
        'cycles', '100',
        'mount', 'Panel mount, front fastening',
        'shell', 'Zinc die-cast, Ni plated',
        'cableOd', '4 \u2013 6 mm'
      )
    },
    {
      id: 'KRO-FPC30-05', cat: 'connector', pill: 'Connector', pkg: '30P', status: 'stock',
      key: 'FPC / FFC \u00b7 30 pos \u00b7 0.5 mm \u00b7 ZIF',
      specs: spec(
        'pitch', '0.5 mm',
        'positions', '30',
        'current', '0.5 A / contact',
        'vrating', '50 V AC/DC',
        'contactType', 'ZIF, top contact',
        'height', '2.0 mm',
        'cycles', '20',
        'plating', 'Sn over Ni',
        'tempRange', '\u221240 to +85 \u00b0C'
      )
    }
  ];

  /* parts manufactured to order rather than held in stock */
  var BUILD = {
    KRC1210X7R225K100: 1, KRC1812X7S107M100: 1, KRC2220X7R475K102: 1,
    'KRS-CUR-30A': 1, 'KRIC-RS485': 1, 'KRO-CIR08-IP67': 1
  };
  LIST.forEach(function (p) { if (BUILD[p.id]) p.status = 'build'; });

  /* resolve asset paths + normalise */
  LIST.forEach(function (p) {
    p.img = 'img/p/' + p.id + '.svg';
    p.ds = 'datasheets/' + p.id + '.pdf';
  });

  window.KRD_PRODUCTS = LIST;

  /* category metadata */
  window.KRD_CATS = {
    mlcc: { pill: 'MLCC', nav: 'nav.p1', title: 'pd.c1.t', blurb: 'pd.c1.d' },
    sensor: { pill: 'Sensor', nav: 'nav.p2', title: 'pd.c2.t', blurb: 'pd.c2.d' },
    chip: { pill: 'MOSFET', nav: 'nav.p3', title: 'pd.c3.t', blurb: 'pd.c3.d' },
    connector: { pill: 'Connector', nav: 'nav.p4', title: 'pd.c4.t', blurb: 'pd.c4.d' }
  };

  window.KRD_SPEC = spec;
})();
