import React, { useState, useEffect } from 'react';
import { Settings, CheckCircle, XCircle, Plus, Edit2, Trash2, BookOpen, Tag, Clock, User, Eye, AlertTriangle } from 'lucide-react';
import { api } from '../utils/api';
import { Poem, Category } from '../../shared/types.js';
import { cn } from '../lib/utils';
import Empty from '../components/Empty';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'review' | 'categories'>('review');
  const [pendingPoems, setPendingPoems] = useState<Poem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'review') {
        const res = await api.admin.getPending();
        if (res.success && res.data) {
          setPendingPoems(res.data);
        }
      } else {
        const res = await api.admin.getCategories();
        if (res.success && res.data) {
          setCategories(res.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    const res = await api.admin.approve(id);
    if (res.success) {
      setPendingPoems(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleReject = async (id: number) => {
    const res = await api.admin.reject(id);
    if (res.success) {
      setPendingPoems(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) return;

    try {
      if (editingCategory) {
        const res = await api.admin.updateCategory(editingCategory.id, categoryForm);
        if (res.success) {
          setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, ...categoryForm } : c));
        }
      } else {
        const res = await api.admin.createCategory(categoryForm);
        if (res.success && res.data) {
          setCategories(prev => [...prev, res.data!]);
        }
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '' });
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    const res = await api.admin.deleteCategory(id);
    if (res.success) {
      setCategories(prev => prev.filter(c => c.id !== id));
      setDeleteConfirm(null);
    }
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name, description: category.description });
    setShowCategoryModal(true);
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '' });
    setShowCategoryModal(true);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4a7c59] to-[#2d5a3d] flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white font-serif">管理中心</h1>
              <p className="text-gray-400">社区内容审核与分类管理</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#f5f0e1]/10 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('review')}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-md transition-all font-medium',
              activeTab === 'review'
                ? 'bg-[#4a7c59] text-white'
                : 'text-gray-400 hover:text-white'
            )}
          >
            <AlertTriangle className="w-5 h-5" />
            待审核作品
            {pendingPoems.length > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {pendingPoems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-md transition-all font-medium',
              activeTab === 'categories'
                ? 'bg-[#4a7c59] text-white'
                : 'text-gray-400 hover:text-white'
            )}
          >
            <Tag className="w-5 h-5" />
            分类管理
          </button>
        </div>

        {activeTab === 'review' && (
          <div>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-40 bg-[#f5f0e1]/5 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : pendingPoems.length > 0 ? (
              <div className="space-y-4">
                {pendingPoems.map(poem => (
                  <div
                    key={poem.id}
                    className="bg-gradient-to-br from-[#f5f0e1]/10 to-[#f5f0e1]/5 backdrop-blur-sm rounded-2xl p-6 border border-[#f5d742]/20"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f5d742] to-[#e5c400] flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white font-serif mb-1">{poem.title}</h3>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-gray-400">
                              作者: @{poem.author?.username}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[#4a7c59]/20 text-[#4a7c59]">
                              {poem.genre}
                            </span>
                            <span className="text-gray-500 flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(poem.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.open(`/community/${poem.id}`, '_blank')}
                          className="p-2 rounded-lg bg-[#f5f0e1]/10 text-gray-400 hover:text-white hover:bg-[#f5f0e1]/20 transition-all"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleApprove(poem.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-[#4a7c59] rounded-lg text-white font-medium hover:bg-[#3d6b4a] transition-all"
                        >
                          <CheckCircle className="w-4 h-4" />
                          通过
                        </button>
                        <button
                          onClick={() => handleReject(poem.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 rounded-lg text-white font-medium hover:bg-red-600 transition-all"
                        >
                          <XCircle className="w-4 h-4" />
                          拒绝
                        </button>
                      </div>
                    </div>
                    <div className="ml-16">
                      <p className="text-gray-300 font-serif leading-relaxed whitespace-pre-line line-clamp-3">
                        {poem.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                icon={CheckCircle}
                title="暂无待审核作品"
                description="所有作品都已审核完毕"
              />
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div>
            <div className="flex justify-end mb-6">
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#4a7c59] to-[#2d5a3d] rounded-lg text-white font-medium hover:shadow-lg hover:shadow-[#4a7c59]/30 transition-all"
              >
                <Plus className="w-5 h-5" />
                添加分类
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-32 bg-[#f5f0e1]/5 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : categories.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {categories.map(category => (
                  <div
                    key={category.id}
                    className="relative bg-gradient-to-br from-[#f5f0e1]/10 to-[#f5f0e1]/5 backdrop-blur-sm rounded-2xl p-6 border border-[#f5f0e1]/10 group"
                  >
                    <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(category)}
                        className="p-2 rounded-lg bg-[#f5f0e1]/10 text-gray-400 hover:text-white hover:bg-[#f5f0e1]/20 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(category.id)}
                        className="p-2 rounded-lg bg-[#f5f0e1]/10 text-gray-400 hover:text-red-400 hover:bg-red-500/20 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9b59b6] to-[#8e44ad] flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white font-serif mb-2">{category.name}</h3>
                        <p className="text-gray-400 text-sm mb-3">{category.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs',
                            category.isActive
                              ? 'bg-[#4a7c59]/20 text-[#4a7c59]'
                              : 'bg-gray-500/20 text-gray-400'
                          )}>
                            {category.isActive ? '已启用' : '已禁用'}
                          </span>
                          <span className="text-gray-500">
                            创建于 {new Date(category.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {deleteConfirm === category.id && (
                      <div className="absolute inset-0 bg-[#1a1a2e]/95 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                        <div className="text-center p-6">
                          <p className="text-white font-medium mb-4">确定要删除这个分类吗？</p>
                          <p className="text-gray-400 text-sm mb-6">删除后该分类下的作品将不受影响</p>
                          <div className="flex items-center gap-4 justify-center">
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-6 py-2 bg-[#f5f0e1]/10 rounded-lg text-gray-300 hover:bg-[#f5f0e1]/20 transition-all"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="px-6 py-2 bg-red-500 rounded-lg text-white hover:bg-red-600 transition-all"
                            >
                              确认删除
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                icon={Tag}
                title="暂无分类"
                description="点击上方按钮添加第一个分类"
              />
            )}
          </div>
        )}

        {showCategoryModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#1a1a2e] rounded-2xl p-8 border border-[#f5f0e1]/10 max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold text-white mb-6">
                {editingCategory ? '编辑分类' : '添加分类'}
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-white font-medium mb-2">分类名称</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="请输入分类名称"
                    className="w-full px-4 py-3 bg-[#0f0f1a] border border-[#f5f0e1]/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4a7c59] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">分类描述</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="请输入分类描述"
                    rows={3}
                    className="w-full px-4 py-3 bg-[#0f0f1a] border border-[#f5f0e1]/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4a7c59] transition-all resize-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 justify-end mt-8">
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                  }}
                  className="px-6 py-2 bg-[#f5f0e1]/10 rounded-lg text-gray-300 hover:bg-[#f5f0e1]/20 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveCategory}
                  disabled={!categoryForm.name.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-[#4a7c59] to-[#2d5a3d] rounded-lg text-white font-medium hover:shadow-lg hover:shadow-[#4a7c59]/30 transition-all disabled:opacity-50"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
