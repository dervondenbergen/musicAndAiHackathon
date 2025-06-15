<script>
    import AudioMotionAnalyzer from 'https://cdn.skypack.dev/audiomotion-analyzer?min';

    let timeElapsed = 0;

    // callback function
    function rotateGradient( analyzer, info ) {
    if ( info.timestamp - timeElapsed > 100 ) {
        timeElapsed = info.timestamp;
        const colorStops = [],
            offset = timeElapsed / 10 % 360;
        
        for ( let i = 360; i >= 0; i -= 60 )
        colorStops.push( `hsl( ${ offset + i }, 100%, 50% )` );
        
        // re-register gradient
        analyzer.registerGradient( 'rainbow', {
                    dir: 'h',
                    colorStops
        });
    }
    }

    // audio source
    const audioEl = document.getElementById('audio');

    // instantiate analyzer
    const audioMotion = new AudioMotionAnalyzer(
    document.getElementById('container'),
    {
        source: audioEl,
        height: window.innerHeight - 50,
        mode: 3,
        gradient: 'rainbow',
        barSpace: .1,
        onCanvasDraw: rotateGradient
    }
    );

    // display module version
    document.getElementById('version').innerText = `v${AudioMotionAnalyzer.version}`;

    // play stream
    document.getElementById('live').addEventListener( 'click', () => {
    audioEl.src = '../../../../backend/test_sound.mp3';
    audioEl.play();
    });

    // file upload
    document.getElementById('upload').addEventListener( 'change', e => {
        const fileBlob = e.target.files[0];

        if ( fileBlob ) {
            audioEl.src = URL.createObjectURL( fileBlob );
            audioEl.play();
        }
    })

</script>