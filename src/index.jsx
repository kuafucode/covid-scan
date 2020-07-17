import api from "@forge/api";
import ForgeUI, { render, Fragment, Image, Text, IssuePanel, useProductContext, useState } from "@forge/ui";

const SCAN_API = 'https://www.cv19scan.site/xray_detection/';
//const SCAN_API = 'https://api.imgur.com/3/image';

function base64ArrayBuffer(arrayBuffer) {
    var base64    = ''
    var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

    var bytes         = new Uint8Array(arrayBuffer)
    var byteLength    = bytes.byteLength
    var byteRemainder = byteLength % 3
    var mainLength    = byteLength - byteRemainder

    var a, b, c, d
    var chunk

    // Main loop deals with bytes in chunks of 3
    for (var i = 0; i < mainLength; i = i + 3) {
        // Combine the three bytes into a single integer
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

        // Use bitmasks to extract 6-bit segments from the triplet
        a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
        b = (chunk & 258048)   >> 12 // 258048   = (2^6 - 1) << 12
        c = (chunk & 4032)     >>  6 // 4032     = (2^6 - 1) << 6
        d = chunk & 63               // 63       = 2^6 - 1

        // Convert the raw binary segments to the appropriate ASCII encoding
        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
    }

    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
        chunk = bytes[mainLength]

        a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

        // Set the 4 least significant bits to zero
        b = (chunk & 3)   << 4 // 3   = 2^2 - 1

        base64 += encodings[a] + encodings[b] + '=='
    } else if (byteRemainder == 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

        a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
        b = (chunk & 1008)  >>  4 // 1008  = (2^6 - 1) << 4

        // Set the 2 least significant bits to zero
        c = (chunk & 15)    <<  2 // 15    = 2^4 - 1

        base64 += encodings[a] + encodings[b] + encodings[c] + '='
    }

    return base64
}

const fetchCommentsForIssue = async (issueId) => {
  const res = await api
    .asApp()
    .requestJira(`/rest/api/3/issue/${issueId}?expand=attachment`);

  const data = await res.json();

  const attId = data.fields.attachment[0].content;


  let attachmentUrl = new URL(attId)
attachmentUrl = attachmentUrl.pathname + attachmentUrl.search; 
  const img = await api
    .asApp()
    .requestJira(attachmentUrl);

  const imgtxt = await img.text();

    const imgBuffer= await img.arrayBuffer();

  return base64ArrayBuffer(imgBuffer);
};

const scanXray = async (file) => {
    var boundary = "---------------------------208043096010081107531634960092";
    var body = '--' + boundary + '\r\n'
        + 'Content-Disposition: form-data; name="csrfmiddlewaretoken"'
        + '\r\n\r\n'
        + 'pWQCuD16NdeneX9AgVe9bK597TQSckzDWvAJ7Jn1JzSocEWGLpDOcmLSgVlAXWHF' + '\r\n'
        + '--' + boundary + '\r\n'
        + 'Content-Disposition: form-data; name="name"'
        + '\r\n\r\n'
        + 'dsads' + '\r\n'
        + '--' + boundary + '\r\n'
        + 'Content-Disposition: form-data; name="email"'
        + '\r\n\r\n'
        + 'dsadsa@dsadsa.com' + '\r\n'
        + '--' + boundary + '\r\n'
        // Parameter name is "file" and local filename is "temp.txt"
        + 'Content-Disposition: form-data; name="files"; '
        + 'filename="IM4 (2).jpeg"\r\n'
        // Add the file's mime-type
        + 'Content-type: image/jpeg\r\n\r\n'
        // Add your data:
        + file + '\r\n'
        + '--'+ boundary + '--';

    //console.log(body);
    // const FormData = require('form-data');
    // const form = new FormData();
    // form.append('name', 'test');
    // form.append('email', 'test@test.com');
    // form.append('files', file, {
    //     filename:    'IM4 (2).jpeg',
    //     contentType: 'image/jpeg',
    // }); // file is attachResponse.arrayBuffer()
  // const scanResponse = await api.fetch(`${SCAN_API}`, {
  //     method: 'POST',
  //     headers: {
  //         'content-type' : 'multipart/form-data:boundary=' + boundary
  //     },
  //     body: body
  //   });
    file = 'data:image/jpeg;base64,' + file;
    const scanResponse = await api.fetch(`${SCAN_API}`, {
        method: 'POST',
        headers: {
            'content-type' : 'application/json'
        },
        body: '{"image" : "' + file + '"}'
    });
    console.log(scanResponse);
  const img = await scanResponse.json();

  return img.images[0];
};

const App = () => {
  const context = useProductContext();

  const [comments] = useState(async () => await fetchCommentsForIssue(context.platformContext.issueKey));

var img = useState(async () => await scanXray(comments));
// img = img[0].substring(0,10) + '...' + img[0].substring(img[0].length-10, img[0].length);
//     return (
//         <Fragment>
//         <Text>{img}</Text>
//         </Fragment>
//     );
//     const img64 = img;
// const imgSrc = 'data:image/jpeg;charset=utf-8;base64, ' + img64;
  return (
    <Fragment>
      <Text>Result : {img.pred}</Text>
<Image src={img.image}/>
    </Fragment>
  );
};

export const run = render(
  <IssuePanel>
    <App />
  </IssuePanel>
);
