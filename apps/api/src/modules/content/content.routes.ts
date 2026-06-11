import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';
import { apiResponse } from '../../utils/helpers';
import { NotFoundError } from '../../utils/errors';

const router = Router();

// ─── Blog ───

// GET /content/blog — Public
router.get('/blog', async (req: Request, res: Response, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(20, parseInt(req.query.limit as string) || 10);
    const posts = await prisma.blogPost.findMany({
      where: { status: 'published' },
      select: { id: true, slug: true, title: true, excerpt: true, featuredImage: true, publishedAt: true, tags: true, author: { select: { firstName: true, lastName: true } } },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit, take: limit,
    });
    res.json(apiResponse(posts));
  } catch (error) { next(error); }
});

// GET /content/blog/:slug
router.get('/blog/:slug', async (req, res, next) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug: req.params.slug },
      include: { author: { select: { firstName: true, lastName: true, avatarUrl: true } } },
    });
    if (!post || post.status !== 'published') throw new NotFoundError('Blog post');
    res.json(apiResponse(post));
  } catch (error) { next(error); }
});

// POST /content/blog — Admin
router.post('/blog', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const post = await prisma.blogPost.create({
      data: { ...req.body, authorId: req.user!.id },
    });
    res.status(201).json(apiResponse(post, 'Blog post created'));
  } catch (error) { next(error); }
});

// PUT /content/blog/:id
router.put('/blog/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const post = await prisma.blogPost.update({ where: { id: req.params.id }, data: req.body });
    res.json(apiResponse(post, 'Blog post updated'));
  } catch (error) { next(error); }
});

// DELETE /content/blog/:id
router.delete('/blog/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.blogPost.delete({ where: { id: req.params.id } });
    res.json(apiResponse(null, 'Blog post deleted'));
  } catch (error) { next(error); }
});

// ─── FAQs ───

// GET /content/faqs
router.get('/faqs', async (req, res, next) => {
  try {
    const faqs = await prisma.faq.findMany({ where: { isPublished: true }, orderBy: { sortOrder: 'asc' } });
    res.json(apiResponse(faqs));
  } catch (error) { next(error); }
});

router.post('/faqs', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const faq = await prisma.faq.create({ data: req.body });
    res.status(201).json(apiResponse(faq, 'FAQ created'));
  } catch (error) { next(error); }
});

router.put('/faqs/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const faq = await prisma.faq.update({ where: { id: req.params.id }, data: req.body });
    res.json(apiResponse(faq, 'FAQ updated'));
  } catch (error) { next(error); }
});

router.delete('/faqs/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.faq.delete({ where: { id: req.params.id } });
    res.json(apiResponse(null, 'FAQ deleted'));
  } catch (error) { next(error); }
});

// ─── Static Pages ───

router.get('/pages/:slug', async (req, res, next) => {
  try {
    const page = await prisma.staticPage.findUnique({ where: { slug: req.params.slug } });
    if (!page || !page.isPublished) throw new NotFoundError('Page');
    res.json(apiResponse(page));
  } catch (error) { next(error); }
});

router.put('/pages/:slug', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const page = await prisma.staticPage.upsert({
      where: { slug: req.params.slug },
      update: req.body,
      create: { slug: req.params.slug, ...req.body },
    });
    res.json(apiResponse(page, 'Page updated'));
  } catch (error) { next(error); }
});

export default router;
