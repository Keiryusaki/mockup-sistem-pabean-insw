function toList(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isReviewer(message, member, reviewerUserIds, reviewerRoleIds) {
  if (reviewerUserIds.includes(message.author.id)) return true;
  if (member?.roles?.cache && reviewerRoleIds.length > 0) {
    return reviewerRoleIds.some((roleId) => member.roles.cache.has(roleId));
  }
  return false;
}

function detectType(content) {
  const normalized = content.toLowerCase();
  if (normalized.includes("perbaikan") || normalized.includes("bug") || normalized.includes("error") || normalized.includes("fix")) {
    return "Perbaikan";
  }
  return "Masukan";
}

function isLikelyImageAttachment(attachment) {
  const name = (attachment.name ?? "").toLowerCase();
  const mime = attachment.contentType?.toLowerCase() ?? "";
  return Boolean(
    mime.startsWith("image/") ||
      attachment.width ||
      attachment.height ||
      name.endsWith(".png") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".gif") ||
      name.endsWith(".webp") ||
      name.endsWith(".bmp") ||
      name.endsWith(".svg"),
  );
}

function pickAttachmentKind(attachment) {
  if (isLikelyImageAttachment(attachment)) return "image";
  return "file";
}

const CURRENT_FEEDBACK_PHASE = "Perubahan Ketiga";

function normalizeFieldName(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function getEmbedField(embed, names) {
  const fields = Array.isArray(embed?.fields) ? embed.fields : [];
  const lookup = new Set(names.map((name) => normalizeFieldName(name)));
  const field = fields.find((item) => lookup.has(normalizeFieldName(item?.name)));
  return typeof field?.value === "string" && field.value.trim() ? field.value.trim() : undefined;
}

function mapEmbedAttachments(message) {
  return message.embeds
    .flatMap((embed, index) => {
      const items = [];

      if (embed.image?.url) {
        items.push({
          name: embed.title ? `${embed.title}.png` : `embed-image-${index + 1}.png`,
          kind: "image",
          mimeType: "image/png",
          previewUrl: embed.image.url,
        });
      }

      if (embed.thumbnail?.url) {
        items.push({
          name: embed.title ? `${embed.title}-thumbnail.png` : `embed-thumbnail-${index + 1}.png`,
          kind: "image",
          mimeType: "image/png",
          previewUrl: embed.thumbnail.url,
        });
      }

      return items;
    })
    .filter(Boolean);
}

export function createDiscordFeedbackMapper(env = process.env) {
  const channelId = env.DISCORD_FEEDBACK_CHANNEL_ID?.trim();
  const reviewerUserIds = toList(env.DISCORD_REVIEWER_USER_IDS);
  const reviewerRoleIds = toList(env.DISCORD_REVIEWER_ROLE_IDS);

  return {
    channelId,
    reviewerUserIds,
    reviewerRoleIds,
    async mapMessage(message, options = {}) {
      const parentMessageId = options.replyToMessageIdOverride ?? message.reference?.messageId ?? undefined;
      const parentId = options.parentIdOverride ?? (parentMessageId ? `discord-${parentMessageId}` : undefined);
      const embed = message.embeds[0];
      const embedTitle = typeof embed?.title === "string" ? embed.title.trim() : "";
      const embedDescription = typeof embed?.description === "string" && embed.description.trim() ? embed.description.trim() : "";
      const typeSource = [embedTitle, embedDescription, message.content].filter(Boolean).join(" ");
      const embedType = getEmbedField(embed, ["Jenis", "Type"]);
      const resolvedType = embedType === "Masukan" || embedType === "Perbaikan" ? embedType : detectType(typeSource);
      const resolvedMember =
        message.member ??
        (message.guild
          ? await message.guild.members.fetch(message.author.id).catch(() => null)
          : null);
      const reporter =
        getEmbedField(embed, ["Nama", "Pelapor", "Name"]) ?? 
        resolvedMember?.nickname ??
        resolvedMember?.displayName ??
        message.author.globalName ??
        message.author.username;
      const page = getEmbedField(embed, ["Halaman", "Page", "Lokasi"]) ?? (message.channel?.name ? `#${message.channel.name}` : "-");
      const url = getEmbedField(embed, ["URL", "Link", "Sumber"]) ?? message.url;
      const phase = getEmbedField(embed, ["Phase", "Tahap"]) ?? CURRENT_FEEDBACK_PHASE;
      const messageText = embedDescription || message.content?.trim() || "(tanpa pesan)";
      const attachmentItems = [
        ...message.attachments.map((attachment) => ({
          name: attachment.name ?? `attachment-${attachment.id}`,
          kind: pickAttachmentKind(attachment),
          mimeType: attachment.contentType ?? undefined,
          size: attachment.size ?? undefined,
          previewUrl: isLikelyImageAttachment(attachment) ? (attachment.proxyURL ?? attachment.url) : undefined,
        })),
        ...mapEmbedAttachments(message),
      ];
      const root = {
        id: `discord-${message.id}`,
        parentId,
        kind: options.kindOverride ?? (parentId ? "reply" : "root"),
        type: options.typeOverride ?? resolvedType,
        reporter,
        authorRole: isReviewer(message, resolvedMember, reviewerUserIds, reviewerRoleIds) ? "reviewer" : "user",
        message: messageText,
        page,
        url,
        createdAt: message.createdAt.toISOString(),
        phase,
        source: "discord",
        status: "Baru",
        channel: message.channel?.name ? `#${message.channel.name}` : undefined,
        discordChannelId: options.discordChannelIdOverride ?? message.channelId,
        discordMessageId: message.id,
        discordReplyToMessageId: options.discordReplyToMessageIdOverride ?? parentMessageId,
        discordMessageUrl: message.url,
        attachments: attachmentItems,
        tags: [
          parentId ? "reply" : "root",
          "discord",
          isReviewer(message, resolvedMember, reviewerUserIds, reviewerRoleIds) ? "reviewer" : "user",
          embedTitle ? normalizeFieldName(embedTitle) : "message",
        ],
      };

      return root;
    },
  };
}
