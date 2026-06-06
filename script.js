function ipParaLong(ip) {
    return ip.split('.').reduce((acc, octeto) => (acc << 8) + parseInt(octeto, 10), 0) >>> 0;
}

function longParaIp(long) {
    return [(long >>> 24) & 255, (long >>> 16) & 255, (long >>> 8) & 255, long & 255].join('.');
}

function mascaraParaCidr(mascaraStr) {
    const octetos = mascaraStr.split('.');

    for (let i = 0; i < octetos.length; i++) {
        const valor = parseInt(octetos[i], 10);
        if (isNaN(valor) || valor < 0 || valor > 255) {
            throw new Error("Máscara inválida. Os octetos devem ser entre 0 e 255.");
        }
    }

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
        const ipOctetos = ipInput.split('.');
        for (let o of ipOctetos) {
            if (parseInt(o, 10) > 255) throw new Error("IP inválido. Os octetos devem ser entre 0 e 255.");
        }

        if (maskInput === "" || maskInput === "/") throw new Error("Máscara ou CIDR inválido.");

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

        const classe = obterClasse(ipInput);
        let cidrPadrao = 24;
        if (classe === "Classe A") cidrPadrao = 8;
        else if (classe === "Classe B") cidrPadrao = 16;

        let htmlSubRedes = "";

        if (cidr > cidrPadrao && cidr < 32) {
            const bitsSubrede = cidr - cidrPadrao;
            const qtdSubredes = Math.pow(2, bitsSubrede);
            const tamanhoBloco = Math.pow(2, 32 - cidr);

            const mascaraClasseLong = (~0 << (32 - cidrPadrao)) >>> 0;
            const inicioRedeMaeLong = (ipLong & mascaraClasseLong) >>> 0;

            htmlSubRedes += `
                <div class="secao-subredes">
                    <h3>Sub-redes Disponíveis (${qtdSubredes})</h3>
                    <div class="tabela-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>ID da Rede</th>
                                    <th>1º IP Válido</th>
                                    <th>Último IP Válido</th>
                                    <th>Broadcast</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            const limiteExibicao = Math.min(qtdSubredes, 128);

            for (let i = 0; i < limiteExibicao; i++) {
                const subRedeIdLong = (inicioRedeMaeLong + (i * tamanhoBloco)) >>> 0;
                const subBcastLong = (subRedeIdLong + tamanhoBloco - 1) >>> 0;

                let pHost = longParaIp(subRedeIdLong + 1);
                let uHost = longParaIp(subBcastLong - 1);

                if (cidr === 31) {
                    pHost = longParaIp(subRedeIdLong);
                    uHost = longParaIp(subBcastLong);
                }

                const classeDestaque = (subRedeIdLong === redeLong) ? "subrede-atual" : "";

                htmlSubRedes += `
                    <tr class="${classeDestaque}">
                        <td>${i + 1}</td>
                        <td><strong>${longParaIp(subRedeIdLong)}</strong></td>
                        <td>${pHost}</td>
                        <td>${uHost}</td>
                        <td><strong class="txt-bcast">${longParaIp(subBcastLong)}</strong></td>
                    </tr>
                `;
            }

            htmlSubRedes += `
                            </tbody>
                        </table>
                    </div>
            `;

            if (qtdSubredes > 128) {
                htmlSubRedes += `<p class="aviso-limite">* Exibindo as primeiras 128 sub-redes de ${qtdSubredes}.</p>`;
            }
            htmlSubRedes += `</div>`;
        }


        resDiv.style.display = "block";
        resDiv.className = "resultado";
        resDiv.innerHTML = `
            <div class="info-principal">
                <p><strong>IP Informado:</strong> ${ipInput}</p>
                <p><strong>Máscara:</strong> ${longParaIp(mascaraLong)}</p>
                <p><strong>Prefixo CIDR:</strong> /${cidr}</p>
                <p><strong>Rede:</strong> ${longParaIp(redeLong)}</p>
                <p><strong>Broadcast:</strong> ${longParaIp(broadcastLong)}</p>
                <p><strong>Primeiro Host:</strong> ${primeiroHost}</p>
                <p><strong>Último Host:</strong> ${ultimoHost}</p>
                <p><strong>Total de Hosts por Rede:</strong> ${totalHosts.toLocaleString('pt-BR')}</p>
                <p><strong>Classe:</strong> ${classe}</p>
            </div>
            ${htmlSubRedes}
        `;

    } catch (error) {
        resDiv.style.display = "block";
        resDiv.className = "resultado erro";
        resDiv.innerHTML = `⚠️ Erro: ${error.message}`;
    }
}

function limpar() {
    document.getElementById('ip').value = "";
    document.getElementById('mascara').value = "";
    const resDiv = document.getElementById('resultado');
    resDiv.innerHTML = "";
    resDiv.style.display = "none";
}