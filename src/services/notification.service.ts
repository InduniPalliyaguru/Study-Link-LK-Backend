import { IListing, Listing } from "../models/listing.model"
import { IRequest } from "../models/request.model"
import { User } from "../models/user.model"
import { emailLayout, escapeHtml, sendEmail } from "./email.service"

const site = () =>
  (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "")

const safely = async (task: () => Promise<void>) => {
  try {
    await task()
  } catch (error) {
    console.error(
      "Notification failed:",
      error instanceof Error ? error.message : error,
    )
  }
}

const loadRequestPeople = async (request: IRequest) => {
  const [buyer, seller, listing] = await Promise.all([
    User.findById(request.buyer),
    User.findById(request.seller),
    Listing.findById(request.listing),
  ])

  return { buyer, seller, listing }
}

export const notifyNewRequest = (request: IRequest) =>
  safely(async () => {
    const { buyer, seller, listing } = await loadRequestPeople(request)

    if (!buyer || !seller || !listing) return

    const note = request.message
      ? `<p style="background:#f2f4ff;padding:10px 14px;border-radius:10px">“${escapeHtml(request.message)}”</p>`
      : ""

    await sendEmail(
      seller.email,
      `New request for "${listing.title}"`,
      emailLayout(
        "You have a new request",
        `<p>Hi ${escapeHtml(seller.name)},</p>
         <p><b>${escapeHtml(buyer.name)}</b> would like to get <b>${escapeHtml(listing.title)}</b> (${
           request.deliveryMethod === "courier"
             ? "by courier"
             : "by meeting in person"
         }).</p>${note}
         <p>Open your requests to accept or reject it.</p>`,
        "View the request",
        `${site()}/requests`,
      ),
    )
  })

export const notifyRequestDecision = (
  request: IRequest,
  decision: "accepted" | "rejected",
) =>
  safely(async () => {
    const { buyer, seller, listing } = await loadRequestPeople(request)

    if (!buyer || !seller || !listing) return

    const accepted = decision === "accepted"

    await sendEmail(
      buyer.email,
      accepted
        ? `Your request was accepted: "${listing.title}"`
        : `Your request was not accepted: "${listing.title}"`,
      emailLayout(
        accepted
          ? "Good news! Your request was accepted"
          : "Your request was not accepted",
        accepted
          ? `<p>Hi ${escapeHtml(buyer.name)},</p>
             <p><b>${escapeHtml(seller.name)}</b> accepted your request for <b>${escapeHtml(listing.title)}</b>.</p>
             <p>Log in to see the seller's contact details and arrange how to get the book.
             ${request.deliveryMethod === "meetup" ? "When you receive the book, ask the seller for the 6-digit code and enter it on the Requests page." : "The seller will post the book to your address."}</p>`
          : `<p>Hi ${escapeHtml(buyer.name)},</p>
             <p>Sorry, <b>${escapeHtml(seller.name)}</b> could not accept your request for <b>${escapeHtml(listing.title)}</b>.
             You can look for another copy on StudyLink LK.</p>`,
        accepted ? "See the details" : "Browse more books",
        accepted ? `${site()}/requests` : `${site()}/browse`,
      ),
    )
  })

export const notifyShipped = (request: IRequest) =>
  safely(async () => {
    const { buyer, listing } = await loadRequestPeople(request)

    if (!buyer || !listing) return

    await sendEmail(
      buyer.email,
      `Your book is on its way: "${listing.title}"`,
      emailLayout(
        "Your book has been posted",
        `<p>Hi ${escapeHtml(buyer.name)},</p>
         <p>The seller posted <b>${escapeHtml(listing.title)}</b> to you.${
           request.trackingNumber
             ? ` Tracking number: <b>${escapeHtml(request.trackingNumber)}</b>.`
             : ""
         }</p>
         <p>When it arrives, press <b>"I received the book"</b> on the Requests page.</p>`,
        "Open my requests",
        `${site()}/requests`,
      ),
    )
  })

export const notifyListingDecision = (
  listing: IListing,
  decision: "approved" | "rejected",
  reason?: string,
) =>
  safely(async () => {
    const seller = await User.findById(listing.seller)

    if (!seller) return

    const approved = decision === "approved"

    await sendEmail(
      seller.email,
      approved
        ? `Your listing is live: "${listing.title}"`
        : `Your listing needs changes: "${listing.title}"`,
      emailLayout(
        approved
          ? "Your listing is live! 🎉"
          : "Your listing needs a few changes",
        approved
          ? `<p>Hi ${escapeHtml(seller.name)},</p>
             <p>An admin approved <b>${escapeHtml(listing.title)}</b>. Students can now find it on StudyLink LK.</p>`
          : `<p>Hi ${escapeHtml(seller.name)},</p>
             <p>An admin could not approve <b>${escapeHtml(listing.title)}</b>.</p>
             <p style="background:#fff1f3;padding:10px 14px;border-radius:10px"><b>Reason:</b> ${escapeHtml(reason ?? "Not given")}</p>
             <p>Edit the listing and it will be reviewed again.</p>`,
        approved ? "See my listings" : "Fix my listing",
        `${site()}/my-listings`,
      ),
    )
  })
