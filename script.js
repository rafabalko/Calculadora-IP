function ipParaLong(ip) {
    return ip.split('.').reduce((acc, octeto) => (acc << 8) + parseInt(octeto, 10), 0) >>> 0;
}

function longParaIp(long) {
    return [(long >>> 24) & 255, (long >>> 16) & 255, (long >>> 8) & 255, long & 255].join('.');
}

function mascaraParaCidr(mascaraStr) {
    const binario = ipParaLong(mascaraStr).toString(2).replace(/0/g, '');
    return binario.length;
}

function obterClasse(ipStr) {
    const primeiro = parseInt(ipStr.split('.')[0], 10);
    if (primeiro >= 1 && primeiro <= 126) return "Classe A";
    if (primeiro >= 128 && primeiro <= 191) return "Classe B";
    if (primeiro >= 192 && primeiro <= 223) return "Classe C";
    return "Outra/Especial";
}

function calcular() {
    const ipInput = document.getElementById('ip').value.trim();
    const maskInput = document.getElementById('mascara').value.trim();
    const resDiv = document.getElementById('resultado');

    try {
        if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ipInput)) throw new Error("IP inválido.");

        let cidr;
        if (maskInput.startsWith('/')) {
            cidr = parseInt(maskInput.slice(1), 10);
        } else if (!isNaN(maskInput)) {
            cidr = parseInt(maskInput, 10);
        } else {
            if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(maskInput)) throw new Error("Máscara inválida.");
            cidr = mascaraParaCidr(maskInput);
        }

        if (cidr < 0 || cidr > 32) throw new Error("Prefixo CIDR inválido (0 a 32).");

        const ipLong = ipParaLong(ipInput);
        const mascaraLong = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;

        const redeLong = (ipLong & mascaraLong) >>> 0;
        const broadcastLong = (redeLong | ~mascaraLong) >>> 0;

        let primeiroHost = longParaIp(redeLong + 1);
        let ultimoHost = longParaIp(broadcastLong - 1);
        let totalHosts = (broadcastLong - redeLong) - 1;

        if (cidr >= 31) {
            primeiroHost = longParaIp(redeLong);
            ultimoHost = longParaIp(broadcastLong);
            totalHosts = cidr === 31 ? 2 : 1;
        }

        resDiv.style.display = "block";
        resDiv.className = "resultado";
        resDiv.innerHTML = `
            <p><strong>IP Informado:</strong> ${ipInput}</p>
            <p><strong>Máscara:</strong> ${longParaIp(mascaraLong)}</p>
            <p><strong>Prefixo CIDR:</strong> /${cidr}</p>
            <p><strong>Rede:</strong> ${longParaIp(redeLong)}</p>
            <p><strong>Broadcast:</strong> ${longParaIp(broadcastLong)}</p>
            <p><strong>Primeiro Host:</strong> ${primeiroHost}</p>
            <p><strong>Último Host:</strong> ${ultimoHost}</p>
            <p><strong>Total de Hosts:</strong> ${totalHosts}</p>
            <p><strong>Classe:</strong> ${obterClasse(ipInput)}</p>
        `;

    } catch (error) {
        resDiv.style.display = "block";
        resDiv.className = "resultado erro";
        resDiv.innerHTML = `⚠️ Erro: ${error.message}`;
    }
}