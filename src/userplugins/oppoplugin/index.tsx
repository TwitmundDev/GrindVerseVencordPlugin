/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandInputType, sendBotMessage } from "@api/Commands";
import { sendMessage } from "@utils/discord";
import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalRoot, openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import { findLazy } from "@webpack";
import { Button, Constants, Forms, React, RestAPI, SearchableSelect, SelectedChannelStore, SnowflakeUtils, Text, TextArea, TextInput, useState } from "@webpack/common";

function FormModal(props: any) {
    const [player, setPlayer] = useState("");
    const [reason, setReason] = useState("");
    const [punishment, setPunishment] = useState<string | null>(null);
    const [customPunishment, setCustomPunishment] = useState("");
    const [proof, setProof] = useState("");
    const [durationValue, setDurationValue] = useState("");
    const [durationUnit, setDurationUnit] = useState<string | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [isSending, setIsSending] = useState(false);

    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const CloudUpload = React.useMemo(() => findLazy((m: any) => m?.prototype?.trackUploadFinished), []);

    const punishmentOptions = [
        { label: "Warn", value: "Warn" },
        { label: "Mute", value: "Mute" },
        { label: "tempmute", value: "tempmute" },
        { label: "Kick", value: "Kick" },
        { label: "Ban", value: "Ban" },
        { label: "tempban", value: "tempban" },
        { label: "Unban", value: "Unban" },
        { label: "Autre…", value: "__custom__" }
    ];

    const durationUnitOptions = [
        { label: "Minutes", value: "minutes" },
        { label: "Hours", value: "hours" },
        { label: "Days", value: "days" },
        { label: "Weeks", value: "weeks" },
        { label: "Months", value: "months" },
        { label: "Years", value: "years" }
    ];

    const submit = () => {
        if (isSending) return;
        const chanId = SelectedChannelStore?.getChannelId?.();
        if (!chanId) return;
        setIsSending(true);

        const finalPunishment = punishment === "__custom__" ? (customPunishment || "") : (punishment || "");
        const proofJoined = proof.trim() ? proof.trim().split(/\s+/).join(" ") : "";

        let durationLine: string | undefined;
        if (durationValue.trim() && durationUnit) {
            durationLine = `duration: ${durationValue.trim()} ${durationUnit}`;
        }

        const content = [
            `player: ${player.trim()}`,
            `reason: ${reason.trim()}`,
            finalPunishment ? `punishment: ${finalPunishment.trim()}` : undefined,
            durationLine,
            proofJoined ? `proof: ${proofJoined}` : undefined
        ].filter(Boolean).join("\n");

        const doSend = async () => {
            if (files.length === 0) {
                sendMessage(chanId, { content });
                return;
            }

            // Upload each file and collect attachment metadata
            const uploads = await Promise.all(files.map(file => new Promise<any>((resolve, reject) => {
                try {
                    const upload = new (CloudUpload as any)({ file, isThumbnail: false, platform: 1 }, chanId, false, 0);
                    upload.on("complete", () => resolve({ filename: upload.filename, uploaded: upload.uploadedFilename }));
                    upload.on("error", (e: any) => reject(e));
                    upload.upload();
                } catch (e) {
                    reject(e);
                }
            })));

            const attachments = uploads.map((u, i) => ({
                id: String(i),
                filename: u.filename,
                uploaded_filename: u.uploaded
            }));

            await RestAPI.post({
                url: (Constants as any).Endpoints.MESSAGES(chanId),
                body: {
                    channel_id: chanId,
                    content,
                    nonce: SnowflakeUtils.fromTimestamp(Date.now()),
                    sticker_ids: [],
                    type: 0,
                    flags: 0,
                    attachments
                }
            });
        };

        doSend().catch(err => {
            console.error("Failed to send message with attachments", err);
            sendMessage(chanId, { content: content + "\n[Attachment upload failed]" });
        }).finally(() => {
            setIsSending(false);
            props.onClose?.();
        });
    };

    return (
        <ModalRoot {...props}>
            <ModalHeader>
                <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                    <Text variant="heading-lg/semibold" style={{ flexGrow: 1 }}>Formulaire du salon</Text>
                    <Text
                        variant="text-xs/semibold"
                        style={{
                            background: "var(--brand-500)",
                            padding: "2px 6px",
                            borderRadius: 6,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            color: "#fff"
                        }}
                    >BETA</Text>
                    <ModalCloseButton onClick={props.onClose} />
                </div>
            </ModalHeader>
            <ModalContent>
                <Text variant="text-sm/normal" color="text-muted" style={{ marginBottom: 8 }}>
                    Remplissez le formulaire puis cliquez sur Envoyer. Les champs Player et Reason sont obligatoires.
                </Text>
                <Forms.FormSection>
                    <Forms.FormTitle>Player</Forms.FormTitle>
                    <TextInput autoFocus value={player} placeholder="Player name / ID" onChange={setPlayer} />
                </Forms.FormSection>

                <Forms.FormSection>
                    <Forms.FormTitle>Reason</Forms.FormTitle>
                    <TextArea value={reason} placeholder="Explain the reason" onChange={setReason} />
                </Forms.FormSection>

                <Forms.FormSection>
                    <Forms.FormTitle>Punishment & Duration</Forms.FormTitle>
                    <div>
                        <SearchableSelect
                            isDisabled={false}
                            options={punishmentOptions}
                            value={punishmentOptions.find(o => o.value === (punishment ?? ""))}
                            onChange={(val: any) => setPunishment(val ?? null)}
                            placeholder="Choose punishment"
                            closeOnSelect
                        />
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <TextInput
                            value={durationValue}
                            placeholder="Duration #"
                            onChange={(v: string) => {
                                const onlyDigits = v.replace(/[^0-9]/g, "");
                                setDurationValue(onlyDigits);
                            }}
                            // @ts-ignore
                            type="number"
                            style={{ flex: 1 }}
                        />
                        <div style={{ flex: 1 }}>
                            <SearchableSelect
                                options={durationUnitOptions}
                                value={durationUnitOptions.find(o => o.value === durationUnit) ?? undefined}
                                onChange={(val: any) => setDurationUnit(val ?? null)}
                                placeholder="Unit"
                                closeOnSelect
                            />
                        </div>
                    </div>
                    {punishment === "__custom__" && (
                        <div style={{ marginTop: 8 }}>
                            <TextInput value={customPunishment} placeholder="Custom punishment" onChange={setCustomPunishment} />
                        </div>
                    )}
                    <Text variant="text-xs/normal" color="text-muted" style={{ marginTop: 4 }}>
                        Leave duration empty for permanent actions.
                    </Text>
                </Forms.FormSection>

                <Forms.FormSection>
                    <Forms.FormTitle>Proof</Forms.FormTitle>
                    <Text variant="text-sm/normal" color="text-muted">Collez des liens (une par ligne).</Text>
                    <TextArea value={proof} placeholder="https://example.com/proof1.png\nhttps://example.com/proof2.jpg" onChange={setProof} />
                    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                        <Button size={Button.Sizes.SMALL} onClick={() => fileInputRef.current?.click()} disabled={isSending}>
                            Add files
                        </Button>
                        {files.length > 0 && (
                            <Text variant="text-xs/normal" color="text-muted">{files.length} file(s) selected</Text>
                        )}
                        {files.length > 0 && (
                            <Button size={Button.Sizes.SMALL} color={Button.Colors.PRIMARY} onClick={() => setFiles([])} disabled={isSending}>
                                Clear
                            </Button>
                        )}
                    </div>
                    {files.length > 0 && (
                        <ul style={{ marginTop: 4, maxHeight: 100, overflowY: "auto", paddingLeft: 16 }}>
                            {files.map((f, i) => (
                                <li key={i} style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                                    <span style={{ flexGrow: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</span>
                                    <Button
                                        size={Button.Sizes.MIN}
                                        color={Button.Colors.PRIMARY}
                                        onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                                        disabled={isSending}
                                    >X</Button>
                                </li>
                            ))}
                        </ul>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        style={{ display: "none" }}
                        onChange={e => {
                            const list = Array.from(e.target.files || []);
                            if (list.length) setFiles(prev => [...prev, ...list]);
                            e.target.value = "";
                        }}
                    />
                </Forms.FormSection>
            </ModalContent>
            <ModalFooter>
                <Button
                    color={Button.Colors.BRAND}
                    disabled={!player.trim() || !reason.trim() || isSending}
                    onClick={submit}
                    style={{ marginRight: 8 }}
                >
                    {isSending ? "Sending..." : "Sent"}
                </Button>
                <Button
                    color={Button.Colors.PRIMARY}
                    onClick={props.onClose}
                    disabled={isSending}
                >
                    Fermer
                </Button>
            </ModalFooter>
        </ModalRoot>
    );
}

function openFormModal() {
    openModal(props => <FormModal {...props} />);
}

export default definePlugin({
    name: "ChannelFormPopup",
    description: "Displays a sanction form via /openform.",
    authors: [{ name: "TonNom", id: 0n }],
    commands: [{
        name: "openform",
        description: "Open the sanction form",
        inputType: ApplicationCommandInputType.BUILT_IN,
        execute(_opts, { channel }) {
            try {
                openFormModal();
            } catch (e) {
                console.error("openFormModal command failed", e);
                return sendBotMessage(channel.id, { content: "Error: Unable to open the form." });
            }
        }
    }]
});
